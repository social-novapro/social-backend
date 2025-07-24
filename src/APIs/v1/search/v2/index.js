const router = require('express').Router();
const { searchV2, explorePage } = require('../../../../utils/search/searchV2');

router.get('/explore', async (req, res) => {
    const found = await explorePage({
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

router.get('/', async (req, res) => {
    console.log("Searching for " + req.headers.lookupkey);
    const found = await searchV2({
        lookUpKey: req.headers.lookupkey ?? null, 
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

module.exports = router;