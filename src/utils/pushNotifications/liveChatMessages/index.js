const interactDeviceTokenPush = require("../../../schemas/notifications/interactDeviceTokenPush");
const { setupAPNProvider, shutdownAPNProvider, pushAppleNotificationDevice } = require("../apnProvider");

async function pushLiveChatMessages(notificationData) {
    const sendDevices = await interactDeviceTokenPush.find({notifications: true, allMessages: true});
    const apnProvider = await setupAPNProvider()

    for (const device of sendDevices) {
        await pushAppleNotificationDevice(apnProvider, {
            userID: device.userID,
            deviceToken: device.deviceToken,
            deviceType: device.deviceType,
            notification: notificationData,
        })
    }

    await shutdownAPNProvider(apnProvider)
    return true
}

module.exports = { pushLiveChatMessages }