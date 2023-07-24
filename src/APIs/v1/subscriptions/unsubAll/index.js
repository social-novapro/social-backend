const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { unsubFromAll } = require('../../../../utils/subscriptions');

router.delete('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;

    const pulled = await unsubFromAll({ userID: userid });

    if (pulled?.error) return res.status(400).send(pulled);
    else return res.status(200).send(pulled);
});

module.exports = router;
