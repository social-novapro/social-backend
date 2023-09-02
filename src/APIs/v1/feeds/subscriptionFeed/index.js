const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { subscriptionFeed } = require('../../../../utils/feeds');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;
    const feed = await subscriptionFeed({ userID: userid })
    
    if (!feed) return res.status(404).send(searchErrorV2("D003", { userID: userid }));
    else return res.status(200).send(feed);
})

module.exports = router;
