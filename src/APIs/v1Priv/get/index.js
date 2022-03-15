const router = require('express').Router();
const allUserData = require('./allUserData');
const userLogin = require('./userLogin');
const devToken = require('./devToken');
const userAnalytics = require('./userAnalytics');

router.use('/allUserData', allUserData);
router.use('/userLogin', userLogin);
router.use('/devToken', devToken);
router.use('/userAnalytics', userAnalytics);

module.exports = router;
