const router = require('express').Router();

const checkToken = require('./checkToken');
const userLogin = require('./userLogin');

router.use('/checkToken', checkToken);
router.use('/userLogin', userLogin);

router.get('/redirect', (req, res) => {
    res.redirect('https://interact.novapro.net/');
})


module.exports = router;
