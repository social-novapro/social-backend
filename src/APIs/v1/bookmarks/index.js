const router = require('express').Router();
const { saveBookmark, removeBookmark, adjustSavedBookmarkList, getBookmarkLists } = require('../../../utils/bookmarks/bookmarkManagerV2');

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

    const savedPost = await saveBookmark({ userID: req.headers.userid, UUID, contentType, listname, listID });
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

router.delete('/unsave', async (req, res) => {
    const { bookmarkID, UUID, listname, listID, contentType } = req.body;

    const savedPost = await removeBookmark({ userID: req.headers.userid, bookmarkID, UUID, contentType, listname, listID });
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

router.put('/move', async (req, res) => {
    const { bookmarkID, listname, listID } = req.body;

    const savedPost = await adjustSavedBookmarkList({ userID: req.headers.userid, bookmarkID, listname, listID });
    if (savedPost.error) return res.status(403).send(savedPost);
    else return res.status(200).send(savedPost);
});

router.get('/lists', async (req, res) => {
    const lists = await getBookmarkLists({ userID: req.headers.userid });
    if (lists.error) return res.status(403).send(lists);
    else return res.status(200).send(lists);
});

module.exports = router;
