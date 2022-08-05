const router = require('express').Router();
const possibleRoutes = require('./possibleRoutes');
 
router.use('/possibleRoutes', possibleRoutes);

module.exports = router;