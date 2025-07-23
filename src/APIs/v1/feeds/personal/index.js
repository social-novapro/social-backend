const router = require('express').Router();
const { buildPersonalizedFeed, wipeUserIndexes } = require('../../../../utils/feeds/personalized');

router.get('/', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});

router.get('/reset', async (req, res) => {
    const { userid: userID } = req.headers;
    const reset = await wipeUserIndexes({ userID });
    if (reset.error) return res.status(400).send(reset);
    else return res.status(200).send(reset);
});

router.get('/:indexID', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid, indexID: req.params.indexID });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});

router.get('/v2', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});
router.get('/v2/:indexID', async (req, res) => {
    const found = await buildPersonalizedFeed({ userID: req.headers.userid, indexID: req.params.indexID });
    if (found.error) return res.status(404).send(found);
    else return res.status(200).send(found);
});

module.exports = router;