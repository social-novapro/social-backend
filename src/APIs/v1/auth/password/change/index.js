const { requestChangePass } = require('../../../../../utils/email/password');

const router = require('express').Router();

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { password } = req.body;
    const { userid } = req.headers;

    const emailRequest = await requestChangePass({ email, userID: userid, password });

    if (!emailRequest || emailRequest?.error) return res.status(400).send(emailRequest);
    return res.status(200).send(emailRequest);
})

module.exports = router;
