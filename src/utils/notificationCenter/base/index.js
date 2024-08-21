const interactNotifications = require('../../../schemas/notifications/interactNotifications');
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const { checktime } = require('../../checktime');
const notif_types = require('../notif_types.json');
const { v4: uuidv4 } = require('uuid');
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

// push any related notifications to any users
async function pushPostNotifs({ postID, userID, postData, userData, coposters, tags }) {
    const subscribedList = await interactSubscribeNotification.findOne({_id: userID});

    var sendQuoteNotif = false;
    var sendReplyNotif = false;
    var taggedNotifs = [];
    // notificationID(s)

    // quote - #3 - dont show if mentioned
    if (postData.isQuote) {
        if (postData.quoteData?.userID != userID) {
            sendQuoteNotif = true
        }
    }

    // reply - #4 - dont show if mentinoed, quoted
    if (postData.isReply) {
        if (!sendQuoteNotif && (postData.replyData?.userID != userID)) {
            sendReplyNotif = true;
        }
    }

   
    // mentions - #1 - get 
    if (tags.length > 0) {
        for (const tag of tags) {
            if ((tag.tagTextOriginal?.startsWith("@")) && tag.userIDTagged != userID) {
                // send notif mentions
                taggedNotifs.push(tag.userIDTagged);

            }
        }
    }


    // coposters - #2 (but also shows if mentioned, shows no matter what)
    if (coposters.length > 0) {
        for (const coposter of coposters) {
            if (coposter != userID) {
                // send notif coposter

                // check for quote
                if (sendQuoteNotif) {
                    if (postData.quoteData?.userID == coposter) {
                        // dont send quote
                        sendQuoteNotif = false;
                    }
                }
            
                // check for reply
                if (sendReplyNotif) {
                    if (postData.replyData?.userID == coposter) {
                        // dont send reply
                        sendReplyNotif = false;
                    }
                }
            }
        }
    }


    // send notif for quote, and reply
    if (sendQuoteNotif) {
        // send quote notif
    }

    if (sendReplyNotif) {
        // send reply notif
    }

    // subscriptions - #5 - dont show if mentioned, quoted, replied
    if (subscribedList && subscribedList.subscribed.length > 0) {
        // create general notif
        const notifSubID = await createNotification({ postID, userID, type: 501 });
        // if isreply, notifID should be 502

        for (const sub of subscribedList.subscribed) {
            if (sub != userID) {
                if (taggedNotifs.includes(sub)) continue; // dont send

                if (sendQuoteNotif) {
                    if (postData.quoteData?.userID == sub) continue; // dont send
                }

                if (sendReplyNotif) {
                    if (postData.replyData?.userID == sub) continue; // dont send
                }

                // finally, send notif sub
            }
        }
    }

    // tags - not yet
    // this will be good for follow notifications

    return true;
}

// push notifications to all users who are subscribed to this user
async function pushUserSubscriptions({ postID, userID, postData }) {
    //  check for recent post from user
}



// create a new notification - meant to send to multiple people
// userID - user who created post
async function createNotification({ postID, userID, type }) {
    const UUID = uuidv4();
    await interactNotifications.create({
        _id: UUID,
        timestamp: checktime(),
        type,
        userID,
        postID,
        version: 2
    });
    return UUID;
}
module.exports = { pushPostNotifs }
