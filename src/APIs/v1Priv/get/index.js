const router = require('express').Router()
const allUserData = require('./allUserData')
const userLogin = require('./userLogin')

router.use('/allUserData', allUserData);
router.use('/userLogin', userLogin);

module.exports = router;
