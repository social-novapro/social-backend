const router = require('express').Router();
const components = require('./create/components');

router.use('/create/components', components)

module.exports = router;
