const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { isSubbed } = require('../../../../utils/notifications/subscriptions/');

router.get('/:subUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;
    const { subUserID } = req.params;

    const subData = await isSubbed({ userID: userid, subUserID });

    if (subData.error) return res.status(400).send(subData);
    else return res.status(200).send(subData);
});

module.exports = router;
