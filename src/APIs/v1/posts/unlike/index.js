const router = require('express').Router();
const { unlikePost } = require('../../../../utils/post/likeUtilV2');

router.delete('/:postID', async (req, res) => {
    const { postID } = req.params;
    const unliked = await unlikePost({ postID, userID: req.headers.userid });

    if (unliked.error) return res.status(403).send(unliked);
    return res.status(200).send(unliked);
})

module.exports = router;
