const router = require('express').Router();
const { buildPersonalizedFeed } = require('../../../../utils/feeds/personalized');

router.get('/', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});

router.get('/:indexID', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid, indexID: req.params.indexID });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});

module.exports = router;