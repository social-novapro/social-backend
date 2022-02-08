const router = require('express').Router()
const allUserData = require('./allUserData')
const userLogin = require('./userLogin')
const devToken = require('./devToken')

router.use('/allUserData', allUserData);
router.use('/userLogin', userLogin);
router.use('/devToken', devToken);

module.exports = router;
