const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { allPostsFeed, allPostsFeedV2 } = require('../../../../utils/feeds');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const allPosts = await allPostsFeed({ userID: req.headers.userid });

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

router.get('/v2', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const allPosts = await allPostsFeedV2({ userID: req.headers.userid });

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

router.get('/v2/:indexID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    const indexID = req.params.indexID;

    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const allPosts = await allPostsFeedV2({ userID: req.headers.userid, indexID});

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

module.exports = router;
