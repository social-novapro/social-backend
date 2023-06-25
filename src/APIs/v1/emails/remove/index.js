const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { requestRemove } = require('../../../../utils/email/removeEmail');

router.delete('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { email, password } = req.body;
    const { userid } = req.headers;

    if (!email) return res.status(400).send(searchError("N002"));

    const emailRequest = await requestRemove({ currentEmail: email, userID: userid, password });

    if (!emailRequest || emailRequest?.error || emailRequest?.code) return res.status(400).send(emailRequest?.error ? emailRequest?.error  : emailRequest );
    return res.status(200).send(emailRequest);
})

module.exports = router;
