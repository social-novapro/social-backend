const router = require('express').Router();
const interactSubscribeNotification = require('../../../../schemas/notifications/interactSubscribeNotification')
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;

    const subData = await interactSubscribeNotification.find({
        "subscribed._id" : userid,
    });

    if (!subData || !subData[0]) return res.status(404).send({"error" : "no subscriptions found"})
  
    return res.status(200).send(subData);
});

module.exports = router;
