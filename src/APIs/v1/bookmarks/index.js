const router = require('express').Router();
const { saveBookmark, removeBookmark, adjustSavedBookmarkList, getBookmarkLists, getUserBookmarks, allowedListChanges, getListInfo, updateBookmarkList, createBookmarkListUser } = require('../../../utils/bookmarks/bookmarkManagerV2');

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

router.get('/', async (req, res) => {
    const { listname, listID, indexID } = req.query;
    const bookmarks = await getUserBookmarks({ userID: req.headers.userid, listname, listID, indexID });

    if (bookmarks.error) return res.status(403).send(bookmarks);
    else return res.status(200).send(bookmarks);
});

router.post('/list/create', async (req, res) => {
    const createdList = await createBookmarkListUser({ userID: req.headers.userid, listID, newInfo: req.body });
    if (createdList.error) return res.status(403).send(createdList);
    else return res.status(200).send(createdList);
});

router.get('/list/changes', async (req, res) => {
    const foundAllowed = await allowedListChanges();

    if (foundAllowed.error) return res.status(500).send(foundAllowed);
    else return res.status(200).send(foundAllowed);
});

router.get('/list/:lookup', async (req, res) => {
    const { lookup } = req.params;
    const foundAllowed = await getListInfo({ userID: req.headers.userid, lookup });
    
    if (foundAllowed.error) return res.status(500).send(foundAllowed);
    else return res.status(200).send(foundAllowed);
});

router.put('/list/:listID', async (req, res) => {
    const { listID } = req.params;
    console.log(req.body)
    const updatedList = await updateBookmarkList({ userID: req.headers.userid, listID, newInfo: req.body });
    if (updatedList.error) return res.status(403).send(updatedList);
    else return res.status(200).send(updatedList);
});
module.exports = router;
