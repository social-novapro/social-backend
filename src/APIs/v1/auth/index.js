const router = require('express').Router();

const checkToken = require('./checkToken');
const userLogin = require('./userLogin');
const password = require('./password');

router.use('/checkToken', checkToken);
router.use('/userLogin', userLogin);
router.use('/password', password);

router.get('/redirect', (req, res) => {
    res.redirect('https://interact.novapro.net/');
})


module.exports = router;
