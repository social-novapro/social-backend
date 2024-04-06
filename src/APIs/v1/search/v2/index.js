const router = require('express').Router();
const { searchV2 } = require('../../../../utils/search/searchV2');

router.get('/', async (req, res) => {
    console.log("Searching for " + req.headers.lookupkey);
    const found = await searchV2({
        lookUpKey: req.headers.lookupkey ?? null, 
        userID: req.headers.userid ?? null
    });

    return res.status(200).send(found);
});

module.exports = router;