const router = require('express').Router();
const create = require('./create');
const get = require('./get');
const createVote = require('./createVote');
const removeVote = require('./removeVote');
const edit = require('./edit');
const deleteRoute = require('./delete');
const appOptions = require('./addOptions');
const userVote = require('./userVote');

router.use('/create', create);
router.use('/get', get);
router.use('/createVote', createVote);
router.use('/removeVote' , removeVote);
router.use('/edit', edit);
router.use('/delete', deleteRoute);
router.use('/addOptions', appOptions);
router.use('/userVote', userVote)

module.exports = router;
