const router = require('express').Router();
const { getSubscriptions } = require('../../../../utils/notifications/subscriptions');

router.get('/', async (req, res) => {
    const { userid } = req.headers;

    const subData = await getSubscriptions({ userID: userid });

    if (subData.error) return res.status(400).send(subData);
    else return res.status(200).send(subData);
});

module.exports = router;
