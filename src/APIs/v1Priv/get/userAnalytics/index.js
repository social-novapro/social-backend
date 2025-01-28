const router = require('express').Router();
const interactUserAnalyticSchema = require('../../../../schemas/analytics/interactUserAnalyticSchema');

router.get('/:userID', async (req, res) => {
    const { userid } = req.headers;
    const userAnalytics = await interactUserAnalyticSchema.findOne({ _id: userid});

    return res.status(200).send(userAnalytics);
})

module.exports = router;
