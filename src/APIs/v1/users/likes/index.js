const router = require('express').Router();
const { getUserLikesRouteFace } = require('../../../../utils/post/likeUtilV2');

router.get('/:userID', async (req, res) => {
    const likeData = await getUserLikesRouteFace({ userID: req.params.userID, ownUserID: req.headers.userid });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

router.get('/index/:indexID', async (req, res) => {
    const { indexID } = req.params;
    const likeData = await getUserLikesRouteFace({ indexID, ownUserID: req.headers.userid });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

module.exports = router;
