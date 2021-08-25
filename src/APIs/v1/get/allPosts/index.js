const router = require('express').Router()
const interactPostSchema = require('../../../../schemas/interactPostSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')

router.get('/', async (req, res) => {
    const AllPosts = await interactPostSchema.find()
    
    sendPosts = [ ]
    for (post of AllPosts) {
        if (post.content) {
            /*if (post.userID) {
                const UserData = await interactUserSchema.findOne({_id: post.userID})
                if (!UserData) post.userData = {}
                else post.userData = UserData
            }*/
            sendPosts.push(post)
        }
       
    }
    if (!AllPosts) return res.status(404).send(searchError("D003"))
    else return res.status(200).send(sendPosts);
})

module.exports = router;
