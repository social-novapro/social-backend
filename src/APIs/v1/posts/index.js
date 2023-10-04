const router = require('express').Router();
const get = require('./get');
const create = require('./create');
const remove = require('./remove');
const save = require('./save');
const bookmarks = require('./bookmarks');

router.use('/get', get);
router.use('/create', create);
router.use('/remove', remove)
router.use('/save', save);
router.use('/bookmarks', bookmarks);


/* 
DONE
/get/post -> /post
/post/create -> /create
/delete/removePost -> /remove
/post/savePost -> /save
/get/bookmarks -> /bookmarks

TODO
/delete/unlikePost -> /unlike
/get/postLikedBy -> /likes
/get/postReplies -> /replies
/get/postEditHistory -> /edits
/put/editPost -> /edit
/put/likePost -> /like

TO CREATE
/unsave

*/
module.exports = router;
