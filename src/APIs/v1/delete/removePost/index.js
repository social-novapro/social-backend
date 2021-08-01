const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const {searchError} = require('../../../../utils/searchError')

router.delete('/:postID', async (req, res) => {
    const { postID } = req.params

    const PostData = await interactPostSchema.findOneAndDelete({_id: postID})
    if (!PostData) return res.status(404).send(searchError("D001"))
    else return res.status(200).send("The post has been deleted.");
})

module.exports = router;
