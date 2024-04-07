const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactEmailVerificationSchema = require('../../../../schemas/emails/interactEmailVerificationSchema');
const interactUserAccessSchema = require('../../../../schemas/interactUserAccessSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactVerificationSchema = require('../../../../schemas/interactVerificationSchema');
const interactDeviceTokenPush = require('../../../../schemas/notifications/interactDeviceTokenPush');
const interactBadgeSchema = require('../../../../schemas/user/interactBadgeSchema');
const { v4: uuidv4 } = require('uuid');
const { getiOSAppToken } = require('../../../getiOSBetaToken');

// dev
const iOSBetaAppToken = getiOSAppToken();
// prod
//const iOSBetaAppToken = "efb5cadc-45e2-4ba9-943f-0a24c2c88124";

async function updateUserBadges() {
    const updates = [];
    const users = await interactUserSchema.find();
    users.sort((a, b) => a.creationTimestamp - b.creationTimestamp);
    var totalUpdated = 0;
    for (const user of users) {
        totalUpdated++;
        var update = { }
        update["verified"] = await verifiedBadge(user);
        update["year_1_beta_user"] = await year1Badge(user);
        update["beta_user"] = await betaBadge(user);
        if (totalUpdated <= 100) update["first_100_user"] = await first100Badge(user);
        else update["first_100_user"] = false;
        update["interact_user"] = await interactUserBadge(user);
        update["ios_beta_user"] = await iOSBetaBadge(user);
        update["developer_account"] = await developerBadge(user);
        update["apps_created"] = await appsCreatedBadge(user);
        update["email_verified"] = await emailVerifiedBadge(user);
        update["admin_account"] = false;
        update["mobile_notifications"] = await mobileNotificationsBadge(user);
        update["userID"] = user._id;
        updates.push(update);
    }

    return { done: true, updates: updates };
}

async function undoUserBadges() {
    await interactBadgeSchema.find().deleteMany();
    
}
/* awards verification to a user */
async function verifiedBadge(user) {
    const verified = user.verified;
    if (!verified) return false;

    const foundVerification = await interactVerificationSchema.findOne({ _id: user._id});
    if (!foundVerification) return false;

    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "verified",
        timestamp: foundVerification.timestamp,
        count: 1
    });

    return true;
}

/* awards year 1 beta user to a user */
async function year1Badge(user) {
    // user creation greater than 2022-07-23
    if (user.creationTimestamp > 1658548800000) return false;
    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "year_1_beta_user",
        timestamp: user.creationTimestamp,
        count: 1
    });
    return true;
}

/* awards beta user to a user */
async function betaBadge(user) {
    // user creation greater than 2023-09-01
    if (user.creationTimestamp > 1693591200000) return false;
    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "beta_user",
        timestamp: user.creationTimestamp,
        count: 1
    });
    return true;
}

/* awards first 100 user to a user */
async function first100Badge(user) {
    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "first_100_user",
        timestamp: user.creationTimestamp,
        count: 1
    });
    return true;
}

/* awards to interact user */
async function interactUserBadge(user) {
    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "interact_user",
        timestamp: user.creationTimestamp,
        count: 1
    });
    return true;
}

/* awards to ios beta users */
async function iOSBetaBadge(user) {
    const access = await interactUserAccessSchema.findOne({ userID: user._id, appToken: iOSBetaAppToken });
    if (!access) return false;
    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "ios_beta_user",
        timestamp: access.creationTimestamp || user.creationTimestamp,
        count: 1
    });
    return true;
}

/* awards to developers */
async function developerBadge(user) {
    const isDev = await developerToken.findOne({ userID: user._id });
    if (!isDev) return false;

    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "developer_account",
        timestamp: isDev.creationTimestamp || user.creationTimestamp,
        count: 1
    });
    return true;
}

/* apps created badge */
async function appsCreatedBadge(user) {
    const apps = await developerAppToken.find({ userID: user._id });
    if (!apps || !apps.length > 0) return false;

    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "apps_created",
        timestamp: apps[0].creationTimestamp||user.creationTimestamp,
        latest_timestamp: apps[apps.length-1].creationTimestamp||user.creationTimestamp,
        count: apps.length
    });
    return true;
}

/* email verified badge */
async function emailVerifiedBadge(user) {
    const emailData = await interactEmailVerificationSchema.findOne({ userID: user._id });
    if (!emailData) return false;
    if (!emailData.verified) return false;

    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "email_verified",
        timestamp: emailData.timestampVerified || emailData.timestamp,
        count: 1
    });
    return true;
}

/* admin account */
// nobodies admin so fuck that

/* mobile notificatinos badge */
async function mobileNotificationsBadge(user) {
    const foundDevices = await interactDeviceTokenPush.find({ userID : user._id });
    if (!foundDevices || !foundDevices.length > 0) return false;

    await interactBadgeSchema.create({
        _id: uuidv4(),
        userID: user._id,
        badgeID: "mobile_notifications",
        timestamp: foundDevices[0].timestamp||user.creationTimestamp,
        count: 1
    });
    return true;
}


module.exports = {
    updateUserBadges,
    undoUserBadges
};