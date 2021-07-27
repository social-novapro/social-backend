const router = require('express').Router()
const user = require('./user')
const allPosts = require('./allPosts')
const post = require('./post')

router.get('/post/:postID', (req, res) => {
    const { postID } = req.params
    console.log(req.headers)
    // const { user } = req.params;
    console.log(req.params)
    
    res.send({
        postID,
        cotent: `Filler content for post data.`,
        timestamp: "1394949949"
    })
})

router.use('/user', user);
router.use('/allPosts', allPosts);
router.use('/post', post)
module.exports = router;
