const interactDeviceTokenPush = require('../../schemas/notifications/interactDeviceTokenPush');
const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../checktime');
const apn = require('apn');
const interactDeviceNotifications = require('../../schemas/notifications/interactDeviceNotifications');
require('dotenv').config({ path: 'secret.env' })
const notificationOptions = require('./notificationOptions.json');
const { searchErrorV2 } = require('../searchError');
const { awardUserBadge, revokeUserBadge } = require('../user/badges');
const { current } = require('../../../config.json')
const productionMode = current == "prod" ? true : false;
const {
    PUSH_KEY_ID,
    PUSH_TEAM_ID,
    PUSH_AUTH_KEY_NAME,
    PUSH_PRODUCTION,
    PUSH_BUNDLE_IDENTIFIER
} = process.env;

notifiationStartupTest();

async function notifiationStartupTest() {
    console.log('---')
    console.log("Notification Startup Testing")
    console.log(`running in ${productionMode ? "production" : "non production"} mode`)
    console.log('---')
    const apnProvider = await setupAPNProvider();
    await shutdownAPNProvider(apnProvider);
}

async function setupAPNProvider() {
    const apnProvider = new apn.Provider({
        token: {
            key: `./env/${PUSH_AUTH_KEY_NAME}`,
            keyId: PUSH_KEY_ID,
            teamId: PUSH_TEAM_ID,
        },
        production: productionMode, // Set to true for production environment
    });
    
    return apnProvider;
}

async function shutdownAPNProvider(apnProvider) {
    apnProvider.shutdown();
    return true;
}

async function sendPushAppleNotification(apnProvider, {userID, type, notification: {title, subtitle, body}}) {
    const foundUser = await interactDeviceTokenPush.find({notifications: true, userID: userID, [type]: true})

    if (!foundUser || foundUser.length === 0) {
        console.log("no user found")
        return searchErrorV2("L013", {userID: userID});
    }

    for (let i = 0; i < foundUser.length; i++) {
        const user = foundUser[i];
        const deviceToken = user.deviceToken;
        const deviceType = user.deviceType;
        if (!deviceToken) continue;

        await pushAppleNotificationDevice(apnProvider, {
            userID: userID,
            deviceToken: deviceToken,
            deviceType: deviceType,
            notification: {title, subtitle, body}
        })
    }

    return true;
}

async function pushAppleNotificationDevice(apnProvider, {userID, deviceToken, deviceType, notification: {title, subtitle, body}}) {
    const notificationSending = new apn.Notification();
    notificationSending.alert = { 
        title: title ? title : "Interact", 
        subtitle: subtitle? subtitle : null, 
        body: body ? body: null
    };
    notificationSending.topic = PUSH_BUNDLE_IDENTIFIER; 

    const result = await apnProvider.send(notificationSending, deviceToken)
    if (result?.sent) {
        await interactDeviceNotifications.create({
            _id: uuidv4(),
            userID: userID,
            timestamp: checktime(),
            notificationId: "empty",
            title: title,
            subtitle: subtitle,
            body: body,
            success: true,
            deviceType: deviceType
        })
        console.log("Notificaiton was sent successfully!")
    }
    if (result?.failed && result?.failed[0]?.response) {
        console.log(result?.failed[0]?.response)
        await interactDeviceNotifications.create({
            _id: uuidv4(),
            userID: userID,
            timestamp: checktime(),
            notificationId: "empty",
            title: title,
            subtitle: subtitle,
            body: body,
            success: false,
            deviceType: deviceType
        })
        searchErrorV2("L014", { userID: userID })
    }

    return true
}

async function registerDevice({userID, deviceToken, deviceType}) {
    if (!userID || !deviceToken || !deviceType) return searchErrorV2("L015", { userID: userID });
    const foundUserDevice = await interactDeviceTokenPush.find({userID: userID, deviceToken: deviceToken})
    if (foundUserDevice && foundUserDevice.length > 0) return searchErrorV2("L016", { userID: userID })
    
    await interactDeviceTokenPush.create({
        _id: uuidv4(),
        userID: userID,
        deviceToken: deviceToken,
        timestamp: checktime(),
        deviceType: deviceType,
    })

    await applyNotificationSettings({userID, deviceToken})
    await awardUserBadge({ userID, badgeID: "mobile_notifications" })
    return true
}

async function deregisterDevice({userID, deviceToken}) {
    if (!userID || !deviceToken) return searchErrorV2("L017", { userID });
    await interactDeviceTokenPush.deleteOne({userID: userID, deviceToken: deviceToken})
    await revokeUserBadge({ userID, badgeID: "mobile_notifications" })
    return true
}

async function updateNotificationSettings({ userID, deviceToken, newSettings }) {
    const foundDevice = await interactDeviceTokenPush.findOne({userID: userID, deviceToken: deviceToken})
    if (!foundDevice) return searchErrorV2("L018", { userID })
    var changed = false;

    newSettings.forEach(setting => {
        foundSetting = notificationOptions.options.find(option => option.name === setting.name);
        if (foundSetting) {
            foundDevice[setting.name] = setting.value;
            changed = true;
        }
    })

    if (!changed) return searchErrorV2("L019", {userID});
    await foundDevice.save();
    return getNotificationSettings({ userID, deviceToken });
}

async function getNotificationSettings({ userID, deviceToken }) {
    const foundDevice = await interactDeviceTokenPush.findOne({userID: userID, deviceToken: deviceToken})
    if (!foundDevice) return searchErrorV2("L018", {userID});

    const settings = [];
    notificationOptions.options.forEach(option => {
        settings.push({
            name: option.name, 
            value: foundDevice[option.name] ? foundDevice[option.name] : false,
            displayName: option.displayName,
            description: option.description,
        })
    })

    return settings;
}

function possibleSettings() {
    return notificationOptions.options;
}

/* for initalizing settings */
async function applyNotificationSettings({ userID, deviceToken }) {
    const foundDevice = await interactDeviceTokenPush.findOne({userID: userID, deviceToken: deviceToken})
    if (!foundDevice) return searchErrorV2("L018", {userID});

    notificationOptions.options.forEach(option => {
        foundDevice[option.name] = option.defaultValue;
    })

    await foundDevice.save();
    return true;
}

module.exports = {
    setupAPNProvider,
    shutdownAPNProvider,
    pushAppleNotificationDevice,
    sendPushAppleNotification,
    registerDevice,
    deregisterDevice,
    applyNotificationSettings,
    updateNotificationSettings,
    getNotificationSettings,
    possibleSettings,
}
