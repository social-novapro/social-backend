const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const alertFunctions = require('../../../../../utils/alerts');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current alert
    const currentAlert = await alertFunctions.getCurrentAlert({systemID: null});
    if (!currentAlert.success) return res.status(400).send(currentAlert);
    else return res.status(200).send(currentAlert);
});

router.get('/:systemID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current alert
    const currentAlert = await alertFunctions.getCurrentAlert({systemID: req.query.systemID});
    if (!currentAlert.success) return res.status(400).send(currentAlert);
    else return res.status(200).send(currentAlert);
});

module.exports = router;