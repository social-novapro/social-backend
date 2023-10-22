const router = require('express').Router();
const { bookmarkPost } = require('../../../../utils/post/bookmarks');

router.post('/', async (req, res) => {
    const { postID, listname } = req.body;
    const { userid } = req.headers;
    const userID = userid;

    const savedPost = await bookmarkPost({userID, postID, listname});
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

module.exports = router;
