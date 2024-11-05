const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const interactNotifications = require('../../../schemas/notifications/interactNotifications');
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const { checktime } = require('../../checktime');
const { getPostWithData } = require('../../post/getPost');
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
        const notifType = 401;
        for (const tag of tags) {
            if ((tag.tagTextOriginal?.startsWith("@")) && tag.userIDTagged != userID) {
                taggedNotifs.push(tag.userIDTagged);

                // send notif mentions
                const notifID = await createNotification({ postID, userID: userIDTagged, type: notifType });
                const notificationLayouts = await createPostNotifLayouts({ userData, postData, type: notifType });
                allNotifs.push({notifID: notifID, notifs: notificationLayouts});
            }
        }
    }

    // coposters - #2 (but also shows if mentioned, shows no matter what)
    if (coposters.length > 0) {
        const notifType = 204;
        for (const coposter of coposters) {
            if (coposter != userID) {
                // send notif coposter
                const notifID = await createNotification({ postID, userID: coposter, type: notifType });
                const notificationLayouts = await createPostNotifLayouts({ userData, postData, type: notifType });
                allNotifs.push({notifID: notifID, notifs: notificationLayouts});
        
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

    const allNotifs = [];

    // send notif for quote, and reply
    if (sendQuoteNotif) {
        const notifType = 404;
        // send quote notif
        const notifID = await createNotification({ postID, userID: postData.quoteData?.userID, type: notifType });
        const notificationLayouts = await createPostNotifLayouts({ userData, postData, type: notifType });
        allNotifs.push({notifID: notifID, notifs: notificationLayouts});
    }

    if (sendReplyNotif) {
        const notifType = 402;
        // send reply notif
        // const sendUserID = postData.replyData?.userID;
        const notifID = await createNotification({ postID, userID: postData.replyData?.userID, type: notifType });
        const notificationLayouts = await createPostNotifLayouts({ userData, postData, type: notifType });
        allNotifs.push({notifID: notifID, notifs: notificationLayouts});
    }

    // subscriptions - #5 - dont show if mentioned, quoted, replied
    if (subscribedList && subscribedList.subscribed.length > 0) {
        const notifType = 501;
        // create general notif
        // const notifID = await createNotification({ postID, userID: subscribedList, type: 501 });
        // // if isreply, notifID should be 502
        
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
                const notifID = await createNotification({ postID, userID: sub, type: notifType });
                const notificationLayouts = await createPostNotifLayouts({ userData, postData, type: notifType });
                allNotifs.push({notifID: notifID, notifs: notificationLayouts});
            }
        }
    }

    // push send all notifs
    for (const notif of allNotifs) {
        // push notif
        console.log(notif);
    }

    // tags - not yet
    // this will be good for follow notifications

    return true;
}

async function createPostNotifLayouts({ userData, postData, type }) {
    const notifType = await interactNotificationCenterTypeSchema.findOne({ _id: type });
    if (!notifType) return { } // return error

    const layouts = []
    for (const system of notifType.pushToSystem) {
        if (system._id == 1) {
            layouts.push({
                _id: system._id,
                type: type,
                userID: userData._id,
                subject: updateStringLayout({ string: system.subject, userData, postData }),
                content: updateStringLayout({ string: system.content, userData, postData })
            })
        } else if (system._id == 2) {
            layouts.push({
                _id: system._id,
                type: type,
                userID: userData._id,
                subject: updateStringLayout({ string: system.subject, userData, postData }),
                htmlP: updateStringLayout({ string: system.htmlP, userData, postData }),
                htmlA: updateStringLayout({ string: system.htmlA, userData, postData }),
            })
        } else if (system._id == 3) {
            layouts.push({
                _id: system._id,
                type: type,
                userID: userData._id,
                title: updateStringLayout({ string: system.title, userData, postData }),
                body: updateStringLayout({ string: system.body, userData, postData }),
                subtitle: updateStringLayout({ string: system.subtitle, userData, postData }),
            })
        } else {
            // unknown system, error
        }
    }

    return layouts;
}

function updateStringLayout({ string, userData, postData }) {
    if (!string) return string;
    var newString = string;

    const placeholders = {
        "[username]": userData.username,
        "[user_tag]": `@${userData.username}`,
        "[post_content]": postData.content,
        "[user_url]": `https://interact.novapro.net/?username=${userData.username}`,
        "[post_url]": `https://interact.novapro.net/?postID=${postData._id}`,
        // Add more placeholders as needed
    };
    
    for (const [placeholder, value] of Object.entries(placeholders)) {
        if (newString.includes(placeholder)) {
            newString = newString.replace(placeholder, value);
        }
    }

    return newString;
}

// push notifications to all users who are subscribed to this user
async function pushUserSubscriptions({ postID, userID, postData }) {
    //  check for recent post from user
}


// create a new notification - meant to send to multiple people
// userID - user who created post
async function createNotification({ postID, userID, type }) {
    const UUID = uuidv4();
    const notifData = await interactNotifications.create({
        _id: UUID,
        timestamp: checktime(),
        type,
        userID,
        postID,
        version: 2
    });
    return notifData;
}

// get all notifications for a user
async function userNotifications({ userID }) {
    const notifs = await interactNotifications.find({ userID, version: 2 });
    const finalNotifs = [];

    for (const notif of notifs) {
        // const foundUser 
        const foundPost = await getPostWithData({ userID, postID: notif.postID });
        const notifHeaders = await interactNotificationCenterTypeSchema.findOne({ _id: notif.type });
        for (const system of notifHeaders.pushToSystem) {
            if (system._id != 1) continue;

            finalNotifs.push({
                _id: system._id,
                type: notif.type,
                userID: userID,
                subject: updateStringLayout({ string: system.subject, userData: foundPost.userData, postData: foundPost.postData }),
                content: updateStringLayout({ string: system.content, userData: foundPost.userData, postData: foundPost.postData })
            })
        }
    }

    return finalNotifs;
}

module.exports = { pushPostNotifs, userNotifications }
