const router = require('express').Router();
const trend = require("./trend")

router.use('/trend', trend);

module.exports = router;