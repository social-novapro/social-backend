const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const { newPostIndex } = require('../../../../utils/post/createPost')
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.post('/', async (req, res) => {
    const postID = await newPostIndex()
    const { content, userID } = req.body 
    
    if (!content && !userID) return res.status(400).send({msg: "You must provide the post content, and a userID in order to submit a post."})
    else if (!content) return res.status(400).send({msg: "You must provide the post content in order to submit a post."})
    else if (!userID) return res.status(400).send({msg: "You must provide a userID in order to submit a post."})
    
    const userIDCheck = await interactUserSchema.findOne({ _id: userID})
  
    if (!userIDCheck) return res.status(403).send({msg: "Forbidden, please have the user sign in!"})

    await interactPostSchema.findOneAndUpdate(
        { _id: postID }, 
        {
            userID,
            content,
        }
    )

    const PostData = await interactPostSchema.findOne({_id: postID})
    if (!PostData) return res.status(404).send({msg: "There was an error trying to create the post."})
    else return res.status(200).send(PostData);
})

module.exports = router;
