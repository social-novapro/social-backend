// const {pushNotification} = require('../pushNotification')
// const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');

async function dismissNotification(userID, notificationID) {
    await interactUserNotifications.findOneAndUpdate( 
        { _id: userID },
        { $pull : { "notifications" : notificationID }},
        { upsert: true }
    );

    const newNotifcations = await interactUserNotifications.findOne({ _id: userID});

    if (newNotifcations[notificationID]) return { "success" : false, "data" : newNotifcations }
    else return { "success" : true, "data" : newNotifcations }
};

module.exports = { dismissNotification };