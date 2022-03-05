const router = require('express').Router();

const checkToken = require('./checkToken');
const userLogin = require('./userLogin');

router.use('/checkToken', checkToken);
router.use('/userLogin', userLogin);

router.get('/redirect', (req, res) => {
    // res.redirect('https://interact.novapro.net/menu')
    // res.redirect('http://192.168.0.70:3000/menu')
    res.redirect('http://localhost:3000/menu')
})

router.get('/:user', (req, res) => {
    console.log(req.body)
   // const { user } = req.body
    const { user } = req.params
    // const { user } = req.params;
    console.log(req.params)

    console.log(user)
    if (req.body)
    res.send({msg: `Your user is : ${user}`})
    if (req.user) {
        /// res.send(req.user);
    }
    else {
       //  res.status(401).send({msg: 'Unauthorized'});
    }
})

module.exports = router;
