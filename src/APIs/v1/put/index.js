const router = require('express').Router();
const editUsername = require('./editUsername');
const editDisplayname  = require('./editDisplayname');
const userEdit = require('./userEdit');

router.use('/editUsername', editUsername);
router.use('/editDisplayname', editDisplayname);
router.use('/userEdit', userEdit);

module.exports = router;
