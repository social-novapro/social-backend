const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.get('/:userID', async (req, res) => {
    const { userID } = req.params
    
    const PostData = await interactPostSchema.find({ userID })
    const UserData = await interactUserSchema.find({ _id: userID})
    const allData = {
        "posts" : PostData,
        "userProfile" : UserData
    }

    return res.status(200).send(allData);
})

module.exports = router
