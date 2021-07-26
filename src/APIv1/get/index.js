const router = require('express').Router()

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

module.exports = router;
