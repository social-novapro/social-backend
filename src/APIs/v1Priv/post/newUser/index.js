const router = require('express').Router()
const { newUserIndex } = require('../../../../utils/user/createUser')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { checktime } = require('../../../../utils/checktime')

router.get('/', async (req, res) => {
    const newUserID = await newUserIndex()

    const currentTime = checktime()
    console.log(currentTime)
    await interactUserSchema.findOneAndUpdate({
        _id: newUserID
    }, {
        creationTimestamp: currentTime,
        followerCount: 0,
        followingCount: 0,
        likeCount: 0,
        likedCount: 0,
        totalPosts: 0,
        totalReplies: 0
    }, {
        upsert: true
    })

    res.status(200).send(newUserID);
})

module.exports = router;
