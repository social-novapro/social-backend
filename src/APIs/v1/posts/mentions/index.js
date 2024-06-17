const router = require('express').Router();
const { getUserMentions } = require('../../../../utils/post/tags');

router.get('/:userID', async (req, res) => {
    const { userID } = req.params;
    const mentionsFound = await getUserMentions({ userID });
    if (mentionsFound.error) return res.status(403).send(mentionsFound);
    return res.status(200).send(mentionsFound);
})

module.exports = router;
