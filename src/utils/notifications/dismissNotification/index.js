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

module.exports = { dismissNotification };