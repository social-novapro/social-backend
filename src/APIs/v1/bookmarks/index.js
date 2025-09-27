const router = require('express').Router();
const { saveBookmark, removeBookmark } = require('../../../utils/bookmarks/bookmarkManagerV2');

/**
 * Save bookmark
 * body: { uuid, listname, listID, contentType }
 * headers: { userid }
 * contentType:
 * 0->5, post, user, notification, ai response, media, chat message
 * if contentType not provided, will try to find content type
 * can provide listname or listID
 * listname defaults to "main"
 * listID overrides listname if both provided
 */
router.post('/save', async (req, res) => {
    const { UUID, listname, listID, contentType } = req.body;
    const { userid } = req.headers;
    const userID = userid;

    const savedPost = await saveBookmark({ userID, UUID, contentType, listname, listID });
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

router.delete('/unsave', async (req, res) => {
    const { bookmarkID, UUID, listname, listID, contentType } = req.body;
    const { userid } = req.headers;
    const userID = userid;

    const savedPost = await removeBookmark({ userID, bookmarkID, UUID, contentType, listname, listID });
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

module.exports = router;
