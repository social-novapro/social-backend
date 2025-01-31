const router = require('express').Router();
const { getPostQuotes, getPostQuotesFull } = require('../../../../utils/post');

router.get('/:postID', async (req, res) => {
    const { postID } = req.params;
    const quotesFound = await getPostQuotes({ postID, userID: req.headers.userid });
    if (quotesFound.error) return res.status(403).send(quotesFound);
    return res.status(200).send(quotesFound);
})

router.get('/full/:postID', async (req, res) => {
    const { postID } = req.params;
    const quotesFound = await getPostQuotesFull({ postID, userID: req.headers.userid });
    if (quotesFound.error) return res.status(403).send(quotesFound);
    return res.status(200).send(quotesFound);
})
module.exports = router;
