const router = require('express').Router();
const { unbookmarkPost } = require('../../../../utils/post/bookmarks');

router.delete('/', async (req, res) => {
    const { postID, listname } = req.body;
    const { userid } = req.headers;
    const userID = userid;

    const savedPost = await unbookmarkPost({userID, postID, listname});
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

module.exports = router;
