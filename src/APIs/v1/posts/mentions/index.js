const router = require('express').Router();
const { getUserMentions } = require('../../../../utils/post');

router.get('/:userID', async (req, res) => {
    const { postID } = req.params;
    const quotesFound = await getUserMentions({ postID, userID: req.headers.userid });
    if (quotesFound.error) return res.status(403).send(quotesFound);
    return res.status(200).send(quotesFound);
})

module.exports = router;
