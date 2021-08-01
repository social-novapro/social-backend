const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const { newPostIndex } = require('../../../../utils/post/createPost')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')

router.post('/', async (req, res) => {
    const postID = await newPostIndex()
    const { content, userID } = req.body 
    
    if (!content && !userID) return res.status(400).send(searchError("E001"))
    else if (!content) return res.status(400).send(searchError("E002"))
    else if (!userID) return res.status(400).send(searchError("E003"))
    else if (content.length > 512) return res.status(400).send(searchError("E005"))

    let myReg = new RegExp("\n", "g")
    var returnedLines = content.match(myReg);
    
    if (returnedLines.length > 10) return res.status(400).send(searchError("E006"))

    const userIDCheck = await interactUserSchema.findOne({ _id: userID})
  
    if (!userIDCheck) return res.status(403).send(searchError("E004"))

    await interactPostSchema.findOneAndUpdate(
        { _id: postID }, 
        {
            userID,
            content,
        }
    )

    const PostData = await interactPostSchema.findOne({_id: postID})
    if (!PostData) return res.status(404).send(searchError("D002"))
    else return res.status(200).send(PostData);
})

module.exports = router;
