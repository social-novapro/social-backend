const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')

router.get('/', async (req, res) => {
    const { userID } = req.params
    
    const AllPosts = await interactPostSchema.find()

    if (!AllPosts) return res.status(404).send({msg: "No posts were found."})
    else return res.status(200).send(AllPosts);
})

module.exports = router;
