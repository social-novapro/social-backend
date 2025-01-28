const router = require('express').Router();
const { subToUser } = require('../../../../utils/notifications/subscriptions/');

router.post('/:subUserID', async (req, res) => {
    const { subUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!subUserID) return res.status(400).send({"error" : "no sub request"});

    const subbed = await subToUser({ userID, subUserID });

    if (subbed.error) return res.status(400).send(subbed);
    else return res.status(200).send(subbed);
});

module.exports = router;
