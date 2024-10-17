const router = require('express').Router();
const components = require('./create/components');
const upload = require('./create/upload');
const get = require('./get');

router.use('/create/components', components);
router.use('/create/upload', upload);
router.use('/get', get)

module.exports = router;
