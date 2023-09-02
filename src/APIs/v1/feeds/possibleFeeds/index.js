const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { getPossiblePreferences } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const possible = getPossiblePreferences(true);
    
    return res.status(200).send(possible);
})

module.exports = router;
