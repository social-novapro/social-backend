const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const alertFunctions = require('../../../../../utils/alerts');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current index
    const currentIndex = await alertFunctions.getCurrentIndex({systemID: null});
    if (!currentIndex.success) return res.status(400).send(currentIndex);
    else return res.status(200).send(currentIndex);
});

router.get('/:systemID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current index
    const currentIndex = await alertFunctions.getCurrentIndex({systemID: req.query.systemID});
    if (!currentIndex.success) return res.status(400).send(currentIndex);
    else return res.status(200).send(currentIndex);
});

module.exports = router;
