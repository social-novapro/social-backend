const router = require('express').Router();
const post = require('./post');
const get = require('./get');

router.use('/post', post);
router.use('/get', get);

module.exports = router;