const router = require('express').Router();
const { getPostTags } = require('../../../../utils/post/tags/getPostTags');

router.get('/:postID', async (req, res) => {
    const tagsFound = await getPostTags({ userID: req.headers.userid, postID: req.params.postID });
    if (tagsFound.error) return res.status(403).send(tagsFound);
    return res.status(200).send(tagsFound);
})

module.exports = router;
