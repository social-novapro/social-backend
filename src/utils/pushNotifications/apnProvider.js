const interactDeviceTokenPush = require('../../schemas/user/interactDeviceTokenPush');
const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../checktime');
const apn = require('apn');
require('dotenv').config({ path: 'secret.env' })

const {
    PUSH_KEY_ID,
    PUSH_TEAM_ID,
    PUSH_AUTH_KEY_NAME,
    PUSH_PRODUCTION,
    PUSH_BUNDLE_IDENTIFIER
} = process.env;

const apnProvider = new apn.Provider({
    token: {
        key: `./env/${PUSH_AUTH_KEY_NAME}`,
        keyId: PUSH_KEY_ID,
        teamId: PUSH_TEAM_ID,
    },
    production: false, // Set to true for production environment
});
console.log("setup notificaiton provider")

async function sendPushAppleNotification({userID, notification: {title, subtitle, body}}) {
    const foundUser = await interactDeviceTokenPush.find({userID: userID})

    if (!foundUser || foundUser.length === 0) {
        console.log("no user found")
        return false;
    }

    for (let i = 0; i < foundUser.length; i++) {
        const user = foundUser[i];
        const deviceToken = user.deviceToken;
        if (!deviceToken) continue;

        const notification = new apn.Notification();
        notification.alert = { title: title ? title : "Interact", subtitle: subtitle, body: body};
        notification.topic = PUSH_BUNDLE_IDENTIFIER; 

        const result = await apnProvider.send(notification, deviceToken)
        if (result?.sent) {
            console.log("Notificaiton was sent successfully!")
        }
        if (result?.failed && result?.failed[0]?.response) {
            console.log(result?.failed[0]?.response)
        }
    }
}

async function registerDevice({userID, deviceToken, deviceType}) {
    if (!userID || !deviceToken || !deviceType) return { error: true };
    const foundUserDevice = await interactDeviceTokenPush.find({userID: userID, deviceToken: deviceToken})
    if (foundUserDevice && foundUserDevice.length > 0) await deregisterDevice({userID, deviceToken});
    await interactDeviceTokenPush.create({
        _id: uuidv4(),
        userID: userID,
        deviceToken: deviceToken,
        timestamp: checktime(),
        deviceType: deviceType
    })

    return true
}

async function deregisterDevice({userID, deviceToken}) {
    if (!userID || !deviceToken) return { error: true };
    await interactDeviceTokenPush.deleteOne({userID: userID, deviceToken: deviceToken})
    return true
}

module.exports = {
    sendPushAppleNotification,
    registerDevice,
    deregisterDevice
}