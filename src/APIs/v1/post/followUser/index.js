const router = require('express').Router();
const interactFollowSchema = require('../../../../schemas/user/interactFollowSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/:followUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { followUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!followUserID) return res.status(400).send({"error" : "no follow request"});

    const postCheck = await interactUserSchema.findOne({ _id: followUserID});
    if (!postCheck) return res.status(403).send({"error" : "No user found for follow"});//("E004"))

    var checkIfFollowed = await lookForFollow(followUserID, userID)
    if (checkIfFollowed.found) return res.status(400).send({ 'error' : "Client was already following user."});

    const savedTimestamp = checktime();
    await interactFollowSchema.findOneAndUpdate( 
        { _id: followUserID },
        { $push : { "follow" : { 
            _id: userID,
            timestamp: savedTimestamp
        }}},
        { upsert: true }
    );
    
    var sending = await lookForFollow(followUserID, userID)
    if (!sending.found) return res.status(404).send({ 'error' : "User was not found to be followed. Error while saving."});
    else return res.status(200).send(sending);
});

module.exports = router;

async function lookForFollow(followUserID, userID) {
    const Followers = await interactFollowSchema.findOne({ _id: followUserID });
    var sending = {
        found: false,
        obj: {}
    };

    if (Followers) {
        for (const fol of Followers.follow) {
            if (fol._id==userID) {
                sending.obj=fol;
                sending.found=true;
            };
        };
    };
    return sending;
};