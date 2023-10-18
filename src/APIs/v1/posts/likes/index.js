const router = require('express').Router();
const { getLikes } = require('../../../../utils/post/likeUtil');

router.get('/:postID', async (req, res) => {
    const likeData = await getLikes({ postID: req.params.postID });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

module.exports = router;
