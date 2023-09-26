const router = require('express').Router();
const theme = require('./theme');

router.use('/theme', theme);

module.exports = router;
