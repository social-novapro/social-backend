const router = require('express').Router();
const interactFollowSchema = require('../../../../schemas/user/interactFollowSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema');

router.get('/:userID', async (req, res) => {
    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({ _id: userID});
    if (!UserData) return res.status(404).send({"error" : "could not find user"})
    const FollowData = await interactFollowSchema.findOne({_id: userID});
    if (!FollowData) return res.status(404).send({"error" : "could not find user"})
    if (!FollowData.follow) return res.status(404).send({"error" : "User was not followed by anybody."})

    return res.status(200).send(FollowData);
});

module.exports = router;
