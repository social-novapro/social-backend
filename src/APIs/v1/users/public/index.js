const router = require('express').Router();
const confirmDelete = require('./confirmDelete');
const demoCreate = require('./demoCreate');

router.use('/confirmDelete', confirmDelete);
router.use('/demoCreate', demoCreate);

module.exports = router;
