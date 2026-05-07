const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { requestRemove } = require('../../../../utils/email/setEmail');

router.delete('/', async (req, res) => {
    const { email, password } = req.body;
    const { userid } = req.headers;

    if (!email) return res.status(400).send(searchErrorV2("N004", { userID: userid }));

    const emailRequest = await requestRemove({ currentEmail: email, userID: userid, password });

    if (!emailRequest || emailRequest?.error || emailRequest?.code) return res.status(400).send(emailRequest?.error ? emailRequest?.error  : emailRequest );
    return res.status(200).send(emailRequest);
})

module.exports = router;
