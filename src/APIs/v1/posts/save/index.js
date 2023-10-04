const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { bookmarkPost } = require('../../../../utils/post/bookmarks');

router.post('/', async (req, res) => {
    const { postID, listname } = req.body;
    const { userid } = req.headers;
    const userID = userid;
    if (!postID) return res.status(400).send(searchErrorV2("K001", { userID }));

    const savedPost = await bookmarkPost({userID, postID, listname});
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

module.exports = router;
