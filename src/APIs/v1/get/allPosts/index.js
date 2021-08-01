const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const { searchError } = require('../../../../utils/searchError')

router.get('/', async (req, res) => {
    const AllPosts = await interactPostSchema.find()
    
    sendPosts = [ ]
    for (post of AllPosts) if (post.content) sendPosts.push(post)
    
    if (!AllPosts) return res.status(404).send(searchError("D003"))
    else return res.status(200).send(sendPosts);
})

module.exports = router;
