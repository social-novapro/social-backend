const router = require('express').Router();
const interactPostBookmarks = require('../../../../schemas/postSchemas/interactPostBookmarks')
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;

    const userbookmarks = await interactPostBookmarks.findOne({ _id: userid });
    if (!userbookmarks) return res.status(403).send({ "error" : "No bookmarks found."});

    return res.status(200).send(userbookmarks);
});

module.exports = router;
