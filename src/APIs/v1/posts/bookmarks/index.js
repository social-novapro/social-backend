const router = require('express').Router();
const { getBookmarks } = require('../../../../utils/post/bookmarks');

router.get('/', async (req, res) => {
    const { userid } = req.headers;

    const bookmarks = await getBookmarks({ userID: userid });
    if (bookmarks.error) return res.status(403).send(bookmarks);
    else return res.status(200).send(bookmarks);
});

module.exports = router;
