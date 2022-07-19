const router = require('express').Router();
const interactSubscribeNotification = require('../../../../schemas/notifications/interactSubscribeNotification')
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/:subUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { subUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!subUserID) return res.status(400).send({"error" : "no sub request"});

    const postCheck = await interactUserSchema.findOne({ _id: subUserID});
    if (!postCheck) return res.status(403).send({"error" : "No user found for sub"});//("E004"))
    
    var checkIfSubbed = await lookForSub(subUserID, userID)
    if (checkIfSubbed.found) return res.status(400).send({ 'error' : "Client was already subscribed to the user."});

    const savedTimestamp = checktime();
    await interactSubscribeNotification.findOneAndUpdate( 
        { _id: subUserID },
        { $push : { "subscribed" : { 
            _id: userID,
            timestamp: savedTimestamp
        }}},
        { upsert: true }
    );

    var sending = await lookForSub(subUserID, userID)
    if (!sending.found) return res.status(404).send(searchError("L002"));
    else return res.status(200).send(sending);
});

module.exports = router;

async function lookForSub(subUser, userID) {
    const Subscribers = await interactSubscribeNotification.findOne({ _id: subUser });
    var sending = {
        found: false,
        obj: {}
    };

    if (Subscribers) {
        for (const sub of Subscribers.subscribed) {
            if (sub._id==userID) {
                sending.obj=sub;
                sending.found=true;
            };
        };
    }

    return sending 
};