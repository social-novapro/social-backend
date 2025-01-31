const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { setEmail } = require('../../../../utils/email/setEmail');

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    const { userid } = req.headers;

    if (!email) return res.status(400).send(searchError("N002"));

    const emailRequest = await setEmail({ email, userID: userid, password });

    if (!emailRequest || emailRequest?.error) return res.status(400).send(emailRequest);
    return res.status(200).send(emailRequest);
})

module.exports = router;
