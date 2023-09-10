const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const alertFunctions = require('../../../../../utils/alerts');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current index
    const currentIndex = await alertFunctions.getCurrentFullIndex({systemID: null});
   
    if (currentIndex.error) return res.status(400).send(currentIndex);
    else return res.status(200).send(currentIndex);
});

router.get('/:systemID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    // get the current index
    const currentIndex = await alertFunctions.getCurrentFullIndex({systemID: req.query.systemID});
    if (currentIndex.error) return res.status(400).send(currentIndex);
    else return res.status(200).send(currentIndex);
});

module.exports = router;
