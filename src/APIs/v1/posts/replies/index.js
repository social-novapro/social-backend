const router = require('express').Router();
const { getPostReplies } = require('../../../../utils/post');

router.get('/:postID', async (req, res) => {
    const { postID } = req.params;
    const repliesFound = await getPostReplies({ postID, userID: req.headers.userid });
    if (repliesFound.error) return res.status(403).send(repliesFound);
    return res.status(200).send(repliesFound);
})

module.exports = router;
