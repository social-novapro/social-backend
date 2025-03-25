const router = require('express').Router();
const { isSubbed } = require('../../../../utils/notifications/subscriptions/');

router.get('/:subUserID', async (req, res) => {
    const { userid } = req.headers;
    const { subUserID } = req.params;

    const subData = await isSubbed({ userID: userid, subUserID });

    if (subData.error) return res.status(400).send(subData);
    else return res.status(200).send(subData);
});

module.exports = router;
