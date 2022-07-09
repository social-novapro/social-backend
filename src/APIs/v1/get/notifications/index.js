const router = require('express').Router();
const interactNotifications = require('../../../../schemas/notifications/interactNotifications');
const interactUserNotifications = require('../../../../schemas/notifications/interactUserNotifications');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const foundNotifications = await interactUserNotifications.findOne({ _id: userid});
    if (!foundNotifications || !foundNotifications.notifications) return res.status(404).send(searchError("L001"));

    var returnData = {
        amountFound: interactUserNotifications.notifications.length,
        notifications: []
    };

    for (const notfi of foundNotifications.notifications) {
        const fullNotif = await interactNotifications.findOne({_id: notfi});
        if (fullNotif) returnData.notifications.push(fullNotif);
    };

    if (!returnData.notifications) return res.status(404).send(searchError("L001"));

    return res.status(200).send(returnData);
});

module.exports = router;
