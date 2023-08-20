const { requestForgotPass } = require('../../../../../utils/email/password');

const router = require('express').Router();

router.post('/', async (req, res) => {
    const emailRequest = await requestForgotPass({ email });

    if (!emailRequest || emailRequest?.error) return res.status(400).send(emailRequest);
    return res.status(200).send(emailRequest);
})

module.exports = router;
