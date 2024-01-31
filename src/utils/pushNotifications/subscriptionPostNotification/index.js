const interactUserNotifications = require("../../../schemas/notifications/interactUserNotifications");
const { emailNotification } = require("../../notifications/emailNotification");
const { searchErrorV2 } = require("../../searchError");
const { sendPushAppleNotification } = require("../apnProvider");

/* notifications for a subscriber of a user */
async function pushSubscriptionPostNotification(apnProvider, { userData, postData, subscribedList, notificationData}) {
    if (!subscribedList || !subscribedList.subscribed || !subscribedList.subscribed[0]) return searchErrorV2("L012", { userID: userData._id })
    
    for (const user of subscribedList.subscribed) {
        await interactUserNotifications.findOneAndUpdate( 
            { _id: user._id },
            { $push : { "notifications" : notificationData._id}},
            { upsert: true }
        );

        await emailNotification({ 
            userID: user._id, 
            posterUserID: postData.userID, 
            postID: postData._id 
        })

        const subtitle = `New Post from @${userData.username}`;
        const body = postData.content

        await sendPushAppleNotification(apnProvider, { 
            userID: user._id,
            type: "subscription", 
            notification: { subtitle, body }
        })
    }
}

module.exports = { pushSubscriptionPostNotification }