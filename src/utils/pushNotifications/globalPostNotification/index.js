const interactDeviceTokenPush = require("../../../schemas/notifications/interactDeviceTokenPush");
const { pushAppleNotificationDevice } = require("../apnProvider");

async function pushGlobalPostNotification(apnProvider, {postData, notification, subscribersList}) {
    const sendDevices = await interactDeviceTokenPush.find({notifications: true, allPosts: true});

    for (const device of sendDevices) {
        // ignores if user is subscribed to poster
        if (subscribersList != null && subscribersList.length>0) if(subscribersList.some(subscribed => subscribed._id === device.userID)) continue;
        // ignores the user who posted
        if (postData.userID === device.userID) continue; 
        // ignores if user is subscribed to replies, and was replied to
        if (
            postData.isReply && 
            postData.replyData && 
            postData.replyData.userID === device.userID && 
            device.replies == true
        ) continue;
        // ignores if user is subscribed to quotes, and was quoted
        if (
            postData.isQuote && 
            postData.quoteData && 
            postData.quoteData.userID === device.userID && 
            device.quotes == true
        ) continue;

        await pushAppleNotificationDevice(apnProvider, {
            userID: device.userID,
            deviceToken: device.deviceToken,
            deviceType: device.deviceType,
            notification: notification,
        })
    }

    return true
}

module.exports = { pushGlobalPostNotification }