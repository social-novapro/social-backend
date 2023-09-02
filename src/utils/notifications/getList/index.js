const interactNotifications = require('../../../schemas/notifications/interactNotifications');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const { searchErrorV2 } = require('../../searchError');

async function getNotifications({ userID }) {
    const foundNotifications = await interactUserNotifications.findOne({ _id: userID });
    if (!foundNotifications || !foundNotifications.notifications) return searchErrorV2("L001", { userID });

    var returnData = {
        amountFound: foundNotifications.notifications.length ? foundNotifications.notifications.length : 0,
        notifications: []
    };

    for (const notfi of foundNotifications.notifications) {
        const fullNotif = await interactNotifications.findOne({_id: notfi});
        if (fullNotif) returnData.notifications.push(fullNotif);
    };

    if (!returnData.notifications || !returnData.notifications[0]) return searchErrorV2("L001", { userID });

    return returnData;
};

module.exports = { getNotifications }
