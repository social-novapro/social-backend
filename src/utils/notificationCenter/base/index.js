const notif_types = require('../notif_types.json');
/* 
this is the base notification center

this will be called for any notifications, and then the specific notification center will be called


schemas needed:
notificationCenterSchema ?/ nvm?
- more like an archive of all notifications
- notifUUID : links to other schemas
- notifSystem : system of notification
- userID : user who the notification is for

emailNotificationSchema

iosNotificationSchema

notificaitonSchema
- (_id) notifUUID : links to other schemas
- dismissed : boolean
- read : boolean
- userID : user who the notification is for
- indexID
- timestamp
- notifType : type of notification


interactEmailSchema
- same as before, its to make sure i have a copy of the email sent
*/
const notificationTimeLimit = 1000*60*60; // 1 hour 

// function for each main notification type
// async function notificationCenterLikePost()

// entry point for all notifications

// entry point for follow notifications

async function notificationCenterFollowUser({ userID, followedUserID }) {
    // check if recently got notif for this 
    // type 601

    const prevRelated = await checkForNotif({ userID, type: 601 });

}

async function checkForNotif({ userID, type }) {
    const notif = await interactNotifications.findOne({
        userID,
        type,
        timestamp: {
            $gt: Date.now() - notificationTimeLimit
        }
    })

    if (!notif) return false;
    return true;
}