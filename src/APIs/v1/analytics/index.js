const router = require('express').Router();
const analyticTrend = require("./analyticTrend")

router.use('/analyticTrend', analyticTrend);

module.exports = router;