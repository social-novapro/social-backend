const router = require('express').Router();
const { getHashtags } = require('../../../../utils/post/tags');

router.get('/', async (req, res) => {
    const tagsFound = await getHashtags({ userID: req.headers.userid, tagText: req.headers.lookupkey});
    if (tagsFound.error) return res.status(403).send(tagsFound);
    return res.status(200).send(tagsFound);
})

module.exports = router;
