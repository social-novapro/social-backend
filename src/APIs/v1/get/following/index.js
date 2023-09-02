const router = require('express').Router();
const interactFollowSchema = require('../../../../schemas/user/interactFollowSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({ _id: userID});
    if (!UserData) return res.status(404).send({"error" : "could not find user"})
    // const FollowData = await interactFollowSchema.find({"follow" : { _id: userID }});
    const FollowData = await interactFollowSchema.find({
        "follow._id" : userID,
    });

    // console.log(FollowData)
    // console.log(FollowData[0].follow)
    
    if (!FollowData) return res.status(404).send({"error" : "could not find user"})
    if (!FollowData[0]) return res.status(404).send({"error" : "User was not followed by anybody."})

    return res.status(200).send(FollowData);
});

module.exports = router;
