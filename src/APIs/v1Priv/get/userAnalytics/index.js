const router = require('express').Router();
const interactUserAnalyticSchema = require('../../../../schemas/analytics/interactUserAnalyticSchema');
const { checkRequestTokens } = require('./../../../../utils/checkRequestTokens');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;
    const userAnalytics = await interactUserAnalyticSchema.findOne({ _id: userid});

    return res.status(200).send(userAnalytics);
})

module.exports = router;
