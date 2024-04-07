const router = require('express').Router();
const { updatePrefSearch, exportSearchSettingPage, getUserSearch } = require('../../../utils/search');
const v1 = require('./v1');
const v2 = require('./v2');
const userTag = require('./userTag');

// get v1 search
router.use('/v1', v1);
// get v2 search
router.use('/v2', v2);
// get tag search
router.use('/userTag', userTag);

// get default search
router.get('/', async (req, res) => {
    console.log("Searching for " + req.headers.lookupkey);
    const found = await getUserSearch({
        lookUpKey: req.headers.lookupkey ?? null,
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

// update search setting
router.post('/setting', async (req, res) => {
    const found = await updatePrefSearch({
        userID: req.headers.userid ?? null,
        newSearch: req.body.newSearch ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

// get search settings
router.get('/setting', async (req, res) => {
    const found = await exportSearchSettingPage({
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

module.exports = router;
