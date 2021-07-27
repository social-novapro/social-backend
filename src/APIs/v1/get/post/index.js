const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')

router.get('/:postID', async (req, res) => {
    const { postID } = req.params
    
    const PostData = await interactPostSchema.find({_id: postID})

    if (!PostData) return res.status(404).send({msg: "The provided postID is not valid."})
    else return res.status(200).send(PostData);
})

module.exports = router;
