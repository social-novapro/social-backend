const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { getFeed } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const possible = await getFeed({ userID: req.headers.userid });
    return res.status(200).send(possible);
})

module.exports = router;
