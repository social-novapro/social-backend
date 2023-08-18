// const {pushNotification} = require('../pushNotification')
// const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const { searchErrorV2 } = require('../../searchError');

async function dismissNotification({userID, notificationID}) {
    if (!notificationID) return searchErrorV2("L003", { userID });

    await interactUserNotifications.findOneAndUpdate( 
        { _id: userID },
        { $pull : { "notifications" : notificationID }},
        { upsert: true }
    );

    // makes sure notification is gone
    const newNotifcations = await interactUserNotifications.findOne({ _id: userID});

    if (newNotifcations[notificationID]) return { "success" : false, "data" : newNotifcations }
    else return { "success" : true, "data" : newNotifcations }
};

async function dismissAllNotifications({ userID }) {
    const found = await interactUserNotifications.findOne({ _id: userID }); 
    if (!found) return searchErrorV2("L001", { userID });

    // deletes notification schema, and all attached notifications for user
    // keeps original notifications 
    await interactUserNotifications.findOneAndDelete({ _id: userID});

    const stillAlive = await interactUserNotifications.findOne({ _id: userID }); 

    if (stillAlive) return searchErrorV2("L004", { userID });
    else return {
        "success" : true,
        "data" : found
    };
}

module.exports = { dismissNotification, dismissAllNotifications };