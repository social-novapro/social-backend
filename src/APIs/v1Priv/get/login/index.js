/*
const router = require('express').Router()
const { newUserIndex } = require('../../../../utils/user/createUser')
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.get('/', async (req, res) => {
    const newUserID = await newUserIndex()

    await interactUserSchema.findOneAndUpdate({
        _id: newUserID
    }, {        
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
*/