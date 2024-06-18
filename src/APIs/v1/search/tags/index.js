const router = require('express').Router();
const { searchTagText } = require('../../../../utils/search/searchTags');

router.get('/:text', async (req, res) => {
    console.log("Searching for " + req.params.text);
    const found = await searchTagText({
        text: req.params.text ?? null, 
        userID: req.headers.userid ?? null
    });

    if (!found || found.error) return res.status(400).send(found);
    return res.status(200).send(found);
});

module.exports = router;