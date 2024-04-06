const router = require('express').Router();
const { searchV1 } = require('../../../../utils/search/searchV1');

router.get('/', async (req, res) => {
    console.log("Searching for " + req.headers.lookupkey);
    const found = await searchV1({
        lookUpKey: req.headers.lookupkey ?? null, 
        userID: req.headers.userid ?? null
    });

    return res.status(200).send(found);
});

module.exports = router;