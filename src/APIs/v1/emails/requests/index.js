const router = require('express').Router();
const verification = require('./verification');
const validEmail = require('./validEmail');

router.use('/verification', verification);
router.use('/validEmail', validEmail);

module.exports = router;
