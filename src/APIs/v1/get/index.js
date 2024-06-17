const router = require('express').Router();
const user = require('./user');
const username = require('./username');
const allUsers = require('./allUsers');
const allPublicData = require('./allPublicData');
const analyticTrend = require('./analyticTrend');
const userByID = require('./userByID');
const developer = require('./developer');
const followers = require('./followers');
const following = require('./following');
const groupData = require('./groupData');

router.use('/user', user);
router.use('/username', username);
router.use('/allUsers', allUsers)
router.use('/allPublicData', allPublicData);
router.use('/analyticTrend', analyticTrend);
router.use('/userByID', userByID);
router.use('/developer', developer);
router.use('/followers', followers);
router.use('/following', following);
router.use('/groupData', groupData);

module.exports = router;
