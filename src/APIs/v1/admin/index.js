const router = require('express').Router();
const getAPI = require('./get');
const putAPI = require('./put');
const errors = require('./errors');
const updateActions = require('./updateActions');
const signup = require('./signup');
const list = require('./list');
const dash = require('./dash');

router.use('/dash', dash);
router.use('/errors', errors);
router.use('/get', getAPI);
router.use('/put', putAPI);
router.use('/list', list);
router.use('/updateActions', updateActions);
router.use('/signup', signup)

module.exports = router;
