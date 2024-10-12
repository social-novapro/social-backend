const router = require('express').Router();
const components = require('./create/components');
const upload = require('./create/upload');

router.use('/create/components', components);
router.use('/create/upload', upload);

module.exports = router;
