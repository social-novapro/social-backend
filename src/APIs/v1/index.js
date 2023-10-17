const router = require('express').Router();
const { searchErrorV2 } = require('../../utils/searchError');
const getAPI = require('./get');
const postAPI = require('./post');
const deleteAPI = require('./delete');
const putAPI = require('./put');
const authAPI = require('./auth');
const adminAPI = require('./admin');
const polls = require('./polls');
const emails = require('./emails');
const users = require('./users');
const posts = require('./posts');
const notifications = require('./notifications');
const feeds = require('./feeds');
const files = require('./files');

// Legacy Routes (still used)
router.use('/get', getAPI);
router.use('/post', postAPI);
router.use('/delete', deleteAPI);
router.use('/put', putAPI);

// Feature Routes
router.use('/auth', authAPI);
router.use('/admin', adminAPI);  
router.use('/polls', polls);
router.use('/emails', emails);
router.use('/users', users);
router.use('/posts', posts);
router.use('/subscriptions', notifications);
router.use('/notifications', notifications);
router.use('/feeds', feeds);
router.use('/files', files);

// Legacy Routes
// GET
router.get('/get/allPosts/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I008", { userID: req.headers.userid }));
})
router.get('/get/bookmarks/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I012", {userID: req.headers.userid}));
});
router.get('/get/notifications/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I007",{ userID: req.headers.userid }));
});
router.get('/get/post/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2('I009', { userID: req.headers.userid }))
})
router.get('/get/postEditHistory/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I016", { userID: req.headers.userid }));
})
router.get('/get/postLikedBy/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I015", { userID: req.headers.userid }));
});
router.get('/get/postReplies/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I018", { userID: req.headers.userid }))
})
router.get('/get/subscriptions/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I003", { userID: req.headers.userid }));
});
router.get('/get/userFeed/:userid', async (req, res) => {
    return res.status(400).send(searchErrorV2("I002", { userID: req.headers.userid }));
})
// POST
router.post('/post/createPost/', async (req, res) => {
    return res.status(400).send(searchErrorV2('I010', { userID: req.headers.userid }))
});
router.post('/post/savePost/', async (req, res) => {
    return res.status(400).send(searchErrorV2('I011', { userID: req.headers.userid }));
});
router.post('/post/subUser/:subUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I004", { userID: req.headers.userid }));
});
// DELETE
router.delete('/delete/dismissNotification/:notificationID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I006", { userID : req.headers.userid }));
})
router.delete('/delete/removePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I013", {userID: req.headers.userid}));
})
router.delete('/delete/unlikePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I014", { userID: req.headers.userid }))
})
router.delete('/delete/unsubUser/:unsubUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I005", { userID: req.headers.userid }));
});
// PUT
router.put('/put/editPost/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I019", { userID: req.headers.userid }));
})
router.put('/put/likePost/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I017", { userID: req.headers.userid }));
})

module.exports = router;
