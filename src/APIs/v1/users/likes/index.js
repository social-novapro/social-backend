const router = require('express').Router();
const { getUserLikes } = require('../../../../utils/post/likeUtilV2');

router.get('/:userID', async (req, res) => {
    const likeData = await getUserLikes({ userID: req.params.userID });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

router.get('/:userID/:indexID', async (req, res) => {
    const { userID, indexID } = req.params;
    const likeData = await getUserLikes({ userID, indexID });
    if (likeData.error) return res.status(403).send(likeData);
    return res.status(200).send(likeData);
});

module.exports = router;
