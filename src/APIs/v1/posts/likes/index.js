const router = require('express').Router();
const { getPostLikes } = require('../../../../utils/post/likeUtilV2');

router.get('/:postID', async (req, res) => {
    const likeData = await getPostLikes({ postID: req.params.postID });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

router.get('/:postID/:indexID', async (req, res) => {
    const { postID, indexID } = req.params;
    const likeData = await getPostLikes({ postID, indexID });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

module.exports = router;
