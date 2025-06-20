const router = require('express').Router();
const { likePost } = require('../../../../utils/post/likeUtilV2');

router.put('/:postID', async (req, res) => {
    const { postID } = req.params;

    const likedPost = await likePost({ postID, userID: req.headers.userid });
    if (likedPost.error) return res.status(403).send(likedPost);
   
    return res.status(200).send(likedPost);
})

module.exports = router;
