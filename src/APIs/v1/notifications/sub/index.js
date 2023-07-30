const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { subToUser } = require('../../../../utils/notifications/subscriptions/');

router.post('/:subUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { subUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!subUserID) return res.status(400).send({"error" : "no sub request"});

    const subbed = await subToUser({ userID, subUserID });

    if (subbed.error) return res.status(400).send(subbed);
    else return res.status(200).send(subbed);
});

module.exports = router;
