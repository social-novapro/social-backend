const router = require('express').Router();
const { unsubFromAll } = require('../../../../utils/notifications/subscriptions');

router.delete('/', async (req, res) => {
    const { userid } = req.headers;

    const pulled = await unsubFromAll({ userID: userid });

    if (pulled?.error) return res.status(400).send(pulled);
    else return res.status(200).send(pulled);
});

module.exports = router;
