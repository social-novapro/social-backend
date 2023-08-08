const router = require('express').Router();

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    return res.status(200).send("deniedRequest");
});

module.exports = router;
