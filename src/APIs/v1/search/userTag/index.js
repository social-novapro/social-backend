const router = require('express').Router();
const { searchUserTag } = require('../../../../utils/search/searchUserTag');

router.get('/:username', async (req, res) => {
    console.log("Searching for " + req.params.username);
    const found = await searchUserTag({
        username: req.params.username ?? null, 
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

module.exports = router;