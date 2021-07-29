const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')

router.get('/', async (req, res) => {
    const AllPosts = await interactPostSchema.find()
    
    sendPosts = [ ]
    for (post of AllPosts) if (post.content) sendPosts.push(post)
    
    if (!AllPosts) return res.status(404).send({msg: "No posts were found."})
    else return res.status(200).send(sendPosts);
})

module.exports = router;
