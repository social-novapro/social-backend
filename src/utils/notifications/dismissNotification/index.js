const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const { logData } = require('../../logging');
const { searchErrorV2 } = require('../../searchError');

async function dismissNotification({userID, notificationID}) {
    if (!notificationID) return searchErrorV2("L003", { userID });

    const foundNotif = await interactUserNotifications.findOneAndUpdate( 
        { 
            userID,
            notifications: { $elemMatch: { $eq: notificationID}  }
        },
        { $pull : { "notifications" : notificationID }},
        { upsert: true }
    );
    logData(foundNotif);

    // notification was not found
    if (!foundNotif) return searchErrorV2("L036", { userID });

    // makes sure notification is gone
    const newNotifcations = await interactUserNotifications.findOne({ _id: foundNotif._id });
    if (newNotifcations[notificationID]) return { "success" : false, "data" : newNotifcations }
    else return { "success" : true, "data" : newNotifcations }
};

async function dismissAllNotifications({ userID }) {
    const found = await interactUserNotifications.find({ userID }); 
    if (!found) return searchErrorV2("L001", { userID });

    // deletes notification schema, and all attached notifications for user
    // keeps original notifications 
    for (const notif of found) {
        await interactUserNotifications.deleteOne({ _id: notif._id });
    }

    const stillAlive = await interactUserNotifications.findOne({ _id: userID }); 
    if (stillAlive) return searchErrorV2("L004", { userID });
    else return {
        "success" : true,
        "data" : found
    };
}

module.exports = { dismissNotification, dismissAllNotifications };