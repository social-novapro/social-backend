// interact-user-notifications (references interact-notifications)
const { v4: uuidv4 } = require('uuid');
const notif_types = require('../notif_types.json');
const interactUserNotifications = require("../../../schemas/notifications/interactUserNotifications");
const { getNotifPreference } = require("../updatePreferences");
const interactNotifications = require('../../../schemas/notifications/interactNotifications');
const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const { updateStringLayout } = require('../manage_types/utils');
const { getPostWithData } = require('../../post/getPost');
const { findFollow } = require('../../user/follows/findFollow');
const { getBasicUserData } = require('../../user/getUser');
const { logData } = require('../../logging');

async function pushInAppNotif(incomingNotifData, forUserData) {
    const { forUserID, notifData, notifsLayouts } = incomingNotifData;
    const notifSetting = await getNotifPreference({userID: forUserID, typeID: notifData.type, systemType: 1});

    if (!notifSetting || notifSetting.enabled==0 || notifSetting.error){
        logData("Notif setting problem", notifSetting, forUserID, notifData.type);
        return { error: 'No notif type setting found' };
    }

    const pushDbNotif = await pushNotifToDb({ userID: forUserID, notifID: notifData._id });
    if (!pushDbNotif || pushDbNotif.error) {
        logData("Error pushing to db", pushDbNotif.error);
        return pushDbNotif;
    };

    return { success: true };
}

async function pushNotifToDb({ userID, notifID }) {
    if (!userID) return { error: 'No userID' };

    const currentIndex = await getOrCreateCurrentIndex({ userID });
    if (!currentIndex || currentIndex.error) return { error: 'No current index, and did not return a new one' };

    await interactUserNotifications.findOneAndUpdate({
        _id: currentIndex
    }, {
        $push: {
            notifications: notifID
        },
        $inc: {
            count: 1
        }
    });

    return { success: true };
}

async function getOrCreateCurrentIndex({ userID }) {
    if (!userID) return { error: 'No userID' };
    const foundIndex = await interactUserNotifications.findOne({ userID, current: true, version: 2 });
    if (foundIndex && foundIndex.count<50) return foundIndex._id;
    
    const newIndexID = await createNewIndex({ userID, replaceIndex: foundIndex ? foundIndex._id : null });
    return newIndexID;
}

async function createNewIndex({ userID, replaceIndex }) {
    if (!userID) return { error: 'No userID' };
    logData("making new index")
    
    const newIndexID = uuidv4();
    await interactUserNotifications.create({
        _id: newIndexID,
        userID,
        version: 2,
        notifications: [],
        count: 0,
        current: true,
        prevIndex: replaceIndex ? replaceIndex : null,
        nextIndex: null
    });

    if (replaceIndex) {
        await interactUserNotifications.findOneAndUpdate({
            _id: replaceIndex
        }, {
            nextIndex: newIndexID,
            current: false
        });
    }

    return newIndexID;
}

// get all notifications for a user
async function getUserNotifications({ userID, indexID }) {
    // const notifs = await interactNotifications.find({ userID, version: 2 });
    const finalNotifs = {sectionTypes: notif_types.sectionTypes, notifs: [], indexID: undefined, nextIndex: undefined, prevIndex: undefined};

    // look for index
    var userNotifs;
    if (!userID) return { error: 'No userID' };
    if (indexID) {
        userNotifs = await interactUserNotifications.findOne({ _id: indexID, userID, version: 2 });
        if (!userNotifs) return { error: 'No user notifs found with ID' }; // explict error
    } else {
        userNotifs = await interactUserNotifications.findOne({ userID, current: true, version: 2 });
        if (!userNotifs) return finalNotifs;
    }

    // set ids 
    finalNotifs.indexID = userNotifs._id;
    finalNotifs.nextIndex = userNotifs.nextIndex;
    finalNotifs.prevIndex = userNotifs.prevIndex;

    for (const userNotif of userNotifs.notifications) {
        // const foundUser 
        const notifData = await interactNotifications.findOne({ _id: userNotif });
        if (!notifData) continue; // will move on
        logData(notifData)
        const notifHeaders = await interactNotificationCenterTypeSchema.findOne({ _id: notifData.type });
        
        var system = notifHeaders.pushToSystem[0];
        
        if (system._id != 1) { // must be inapp
            for (const systemLook of notifHeaders.pushToSystem) {
                logData("not found, will look for inapp system")
                if (systemLook._id == 1) {
                    system = systemLook;
                    break;
                }
            }
            if (system._id != 1) continue; // no inapp system found
            else logData("found inapp system")
        }

        var layoutNotif = {
            _id: notifData._id,
            systemID: system._id,
            type: notifData.type,
            notifSubType: notifHeaders.notifSubType,
            notifType: {
                _id: notifData.type,
                name: notifHeaders.name,
                description: notifHeaders.description
            },
            userID: userID,
            timestamp: notifData.timestamp,
            subject: "Default Subject",
            content: "Default Content",
            userData: null,
            postData: null,
            followData: null
        }

        if (notifHeaders.notifSubType == 1) {
            const foundPost = await getPostWithData({ userID, postID: notifData.postID });
            layoutNotif.postData = foundPost;
            layoutNotif.subject = updateStringLayout({ string: system.subject, userData: foundPost.userData, postData: foundPost.postData });
            layoutNotif.content = updateStringLayout({ string: system.content, userData: foundPost.userData, postData: foundPost.postData });
        } else if (notifHeaders.notifSubType == 2) {
            const foundUser = await getBasicUserData({ userID, searchTerm: notifData.userID });
            // const foundUser = await interactUserSchema.findOne({ _id: notifData.userID });
            if (notifData.followID) {
                const foundFollow = await findFollow({ userID, followedUserID: notifData.userID, followID: notifData.followID });
                logData(foundFollow)
                if (foundFollow && !foundFollow.error) layoutNotif.followData = foundFollow.followData;
            }
            layoutNotif.userData = foundUser;
            layoutNotif.subject = updateStringLayout({ string: system.subject, userData: foundUser });
            layoutNotif.content = updateStringLayout({ string: system.content, userData: foundUser });
        }

        logData("type", layoutNotif.type, "subType", layoutNotif.notifSubType)
        finalNotifs.notifs.push(layoutNotif);
    }

    return finalNotifs;
}


module.exports = { pushInAppNotif, getUserNotifications };