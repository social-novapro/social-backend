const { requestForgotPass } = require('../../../../../utils/email/password');
const { checkTypeLogin } = require('../../../../../utils/userAuth');

const router = require('express').Router();

router.post('/', async (req, res) => {
    const { username } = req.body;

    const checkLoginUsername = await checkTypeLogin({ username, allowEmailUnverified: true });
    if (checkLoginUsername.error) return res.status(403).send(checkLoginUsername);

    const { 
        foundUser,
        emailFound,
        emailVerified
    } = checkLoginUsername;

    const emailRequest = await requestForgotPass({ email: emailFound });

    if (!emailRequest || emailRequest?.error) return res.status(400).send(emailRequest);
    return res.status(200).send(emailRequest);
})

module.exports = router;
