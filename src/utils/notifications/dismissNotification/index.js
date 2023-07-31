// const {pushNotification} = require('../pushNotification')
// const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const { searchError } = require('../../searchError');

async function dismissNotification({userID, notificationID}) {
    if (!notificationID) return searchError("L003");

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
    if (!found) return searchError("L001");

    await interactUserNotifications.findOneAndDelete({ _id: userID});

    const stillAlive = await interactUserNotifications.findOne({ _id: userID }); 

    if (stillAlive) return searchError("L004");
    else return {
        "success" : true,
        "data" : found
    };
}

module.exports = { dismissNotification, dismissAllNotifications };