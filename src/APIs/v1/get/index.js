const router = require('express').Router();
const allUsers = require('./allUsers');
const allPublicData = require('./allPublicData');
const analyticTrend = require('./analyticTrend');
const developer = require('./developer');
const groupData = require('./groupData');

router.use('/allUsers', allUsers)
router.use('/allPublicData', allPublicData);
router.use('/analyticTrend', analyticTrend);
router.use('/developer', developer);
router.use('/groupData', groupData);

module.exports = router;
