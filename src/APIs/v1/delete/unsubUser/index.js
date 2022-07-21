const router = require('express').Router();
const interactSubscribeNotification = require('../../../../schemas/notifications/interactSubscribeNotification')
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.delete('/:unsubUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { unsubUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!unsubUserID) return res.status(400).send({"error" : "no sub request"});

    const postCheck = await interactUserSchema.findOne({ _id: unsubUserID});
    if (!postCheck) return res.status(403).send({"error" : "No user found for sub"});//("E004"))
    
    var checkIfSubbed = await lookForSub(unsubUserID, userID)
    if (!checkIfSubbed.found) return res.status(400).send({ 'error' : "Client was not subscribed to the user."});

    await interactSubscribeNotification.findOneAndUpdate( 
        { _id: unsubUserID },
        { $pull : { "subscribed" : {  _id: userID, }}},
        { upsert: true }
    );

    var sending = await lookForSub(unsubUserID, userID)
    if (!sending.found) return res.status(200).send({"success" : true});
    else return res.status(400).send({"error" : "unknown error while unsubcribing"});
});

module.exports = router;

async function lookForSub(unsubUser, userID) {
    const Subscribers = await interactSubscribeNotification.findOne({ _id: unsubUser });
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