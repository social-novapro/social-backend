const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const { newPostIndex } = require('../../../../utils/post/createPost')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')
const { checkPostContent } = require('../../../../utils/checks')

router.post('/', async (req, res) => {
    const { content, userID } = req.body 
    
    if (!content && !userID) return res.status(400).send(searchError("E001"))
    else if (!content) return res.status(400).send(searchError("E002"))
    else if (!userID) return res.status(400).send(searchError("E003"))
    else if (content.length > 512) return res.status(400).send(searchError("E005"))

    const checkedContent = await checkPostContent(content)
    if (checkedContent) return res.status(400).send(checkedContent.error)

    const userIDCheck = await interactUserSchema.findOne({ _id: userID})
  
    if (!userIDCheck) return res.status(403).send(searchError("E004"))
    
    const postID = await newPostIndex(userID, content)

    const PostData = await interactPostSchema.findOne({_id: postID})
    if (!PostData) return res.status(404).send(searchError("D002"))
    else return res.status(200).send(PostData);
})

module.exports = router;
