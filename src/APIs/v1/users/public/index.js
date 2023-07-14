const router = require('express').Router();
const confirmDelete = require('./confirmDelete');
const demoCreate = require('./demoCreate');
const demoDelete = require('./demoDelete');

router.use('/confirmDelete', confirmDelete);
router.use('/demoCreate', demoCreate);
router.use('/demoDelete', demoDelete);

module.exports = router;
