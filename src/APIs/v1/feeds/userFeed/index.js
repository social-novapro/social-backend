const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { allPostsFeedV2 } = require('../../../../utils/feeds');
const { getFeed, getFeedV2 } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const possible = await getFeed({ userID: req.headers.userid });
    return res.status(200).send(possible);
})

router.get('/v2', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const allPosts = await getFeedV2({ userID: req.headers.userid });

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

router.get('/v2/:indexID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    const indexID = req.params.indexID;

    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const allPosts = await getFeedV2({ userID: req.headers.userid, indexID});

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

module.exports = router;
