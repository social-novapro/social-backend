const router = require('express').Router();
const verification = require('./verification');
const validEmail = require('./validEmail');
const confirmRemove = require('./confirmRemove');

router.use('/verification', verification);
router.use('/validEmail', validEmail);
router.use('/confirmRemove', confirmRemove);

module.exports = router;
