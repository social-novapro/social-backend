const router = require('express').Router();
const interactFollowSchema = require('../../../../schemas/user/interactFollowSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.delete('/:unfollowUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { unfollowUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!unfollowUserID) return res.status(400).send({"error" : "no follow request"});

    const postCheck = await interactUserSchema.findOne({ _id: unfollowUserID});
    if (!postCheck) return res.status(403).send({"error" : "No user found for follow"});//("E004"))

    var checkIfFollowed = await lookForFollow(unfollowUserID, userID)
    if (!checkIfFollowed.found) return res.status(400).send({ 'error' : "Client was not found to be following user."});

    await interactFollowSchema.findOneAndUpdate( 
        { _id: unfollowUserID },
        { $pull : { "follow" : { 
            _id: userID,
        }}},
        { upsert: true }
    );
    
    var sending = await lookForFollow(unfollowUserID, userID)
    if (!sending.found) return res.status(200).send({ 'success' : true });
    else return res.status(400).send({"error" : "User was found to be still followed. Error while saving."});
});

module.exports = router;

async function lookForFollow(unfollowUserID, userID) {
    const Followers = await interactFollowSchema.findOne({ _id: unfollowUserID });
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