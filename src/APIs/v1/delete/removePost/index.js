const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema')
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const {searchError} = require('../../../../utils/searchError')

router.delete('/:postID', async (req, res) => {
    const { postID } = req.params
    const { userToken, userID} = req.headers

    if (!userID && !userToken) return res.status(400).send("no userid and userToken")//searchError("E003"))
    else if (!userID) return res.status(400).send("no userid")//searchError("E003"))
    else if (!userToken) return res.status(400).send("no userToken provided.")//searchError("E002"))

    const userIDCheck = await interactUserSchema.findOne({ _id: userID})
    if (!userIDCheck) return res.status(403).send("no user found")//searchError("E004"))

    const userTokenCheck = await interactUserPrivSchema.findOne({_id: userID}) 
    if (userTokenCheck.userToken != userToken) return res.status(403).send("that user token is incorrect.")

    const PostData = await interactPostSchema.findOneAndDelete({_id: postID})
    if (!PostData) return res.status(404).send(searchError("D001"))
    else return res.status(200).send("The post has been deleted.");
})

module.exports = router;
