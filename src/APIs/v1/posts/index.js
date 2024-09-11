const router = require('express').Router();

const get = require('./get');
const create = require('./create');
const remove = require('./remove');

const replies = require('./replies');
const quotes = require('./quotes');

const save = require('./save');
const unsave = require('./unsave');
const bookmarks = require('./bookmarks');

const unlike = require('./unlike');
const likes = require('./likes');
const like = require('./like');

const edits = require('./edits');
const edit = require('./edit');

const coposts = require('./coposts');
const tags = require('./tags');

router.use('/get', get);
router.use('/create', create);
router.use('/remove', remove)

router.use('/replies', replies);
router.use('/quotes', quotes)

router.use('/save', save);
router.use('/unsave', unsave);
router.use('/bookmarks', bookmarks);

router.use('/like', like);
router.use('/likes', likes);
router.use('/unlike', unlike);

router.use('/edit', edit);
router.use('/edits', edits);

router.use('/coposts', coposts);
router.use('/tags', tags);

/* 
DONE
/get/post -> /post
/post/create -> /create
/delete/removePost -> /remove
/post/savePost -> /save
/get/bookmarks -> /bookmarks
/delete/unlikePost -> /unlike
/get/postLikedBy -> /likes
/get/postEditHistory -> /edits
/put/likePost -> /like
/get/postReplies -> /replies
/put/editPost -> /edit

TO CREATE LATER
/unsave

*/
module.exports = router;
