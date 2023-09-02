const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { allPostsFeed } = require('../../../../utils/feeds');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const allPosts = await allPostsFeed({ userID: req.headers.userid});

    if (allPosts?.error) return res.status(404).send(allPosts);
    else return res.status(200).send(allPosts);
})

module.exports = router;
