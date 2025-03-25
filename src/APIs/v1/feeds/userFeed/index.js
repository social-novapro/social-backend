const router = require('express').Router();
const { getFeed, getFeedV2 } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const possible = await getFeed({ userID: req.headers.userid });
    return res.status(200).send(possible);
})

router.get('/v2', async (req, res) => {
    const allPosts = await getFeedV2({ userID: req.headers.userid });

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

router.get('/v2/:indexID', async (req, res) => {
    const indexID = req.params.indexID;
    const allPosts = await getFeedV2({ userID: req.headers.userid, indexID});

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

module.exports = router;
