const router = require('express').Router();
const interactPostBookmarks = require('../../../../schemas/postSchemas/interactPostBookmarks')
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { getBookmarks } = require('../../../../utils/post/bookmarks');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;

    const bookmarks = await getBookmarks({ userID: userid });
    if (bookmarks.error) return res.status(403).send(bookmarks);
    else return res.status(200).send(bookmarks);
});

module.exports = router;
