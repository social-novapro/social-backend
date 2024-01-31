const { setupAPNProvider, shutdownAPNProvider, sendPushAppleNotification } = require("../apnProvider")
const { pushGlobalPostNotification } = require("../globalPostNotification")
const { pushSubscriptionPostNotification } = require("../subscriptionPostNotification")

async function coposterRequestNotification({coposters, userData, content}) {
    const apnProvider = await setupAPNProvider()

    const subtitle = `@${userData.username} wants to copost with you!`
    for (const coposter of coposters) {
        await sendPushAppleNotification(apnProvider, { 
            userID: coposter, 
            type: "coposters",
            notification: { title: "Interact Copost", subtitle, body: content }
        })
    }

    await shutdownAPNProvider(apnProvider)
}

async function pushLikeNotifications({username, postData}) {
    const apnProvider = await setupAPNProvider()

    const subtitle = `@${username} liked your post!`
    await sendPushAppleNotification(apnProvider, { 
        userID: postData.userID, 
        type: "likes",
        notification: { title: "Interact Like", subtitle, body: postData.content }
    })

    if (postData.coposters && postData.coposters.length > 0) {
        for (const coposter of postData.coposters) {
            // send push
            await sendPushAppleNotification(apnProvider, { 
                userID: coposter, 
                type: "likes",
                notification: { title: "Interact Like", subtitle, body: postData.content }
            })
        }
    }

    await shutdownAPNProvider(apnProvider)
}


/* notifications from a new post, for global subs, subscribers, and quote/reply notifications */
async function allNewPostNotifications({ 
    userData,
    postData,
    subscribedList,
    notificationData
}) {
    const apnProvider = await setupAPNProvider()

    pushSubscriptionPostNotification(apnProvider, { 
        userData, 
        postData, 
        subscribedList,
        notificationData
    })

    pushGlobalPostNotification(apnProvider, {
        postData,
        notification: {
            title: "Interact",
            subtitle: `New Post from @${userData.username}`,
            body: postData.content
        },
        subscribersList: subscribedList?.subscribed ?? null
    });

    if (postData.isQuote && postData.quoteData && postData.quoteData.userID) {
        pushQuoteNotification(apnProvider, {username: userData.username, postData});
    }

    if (postData.isReply && postData.replyData && postData.replyData.userID) {
        pushReplyNotification(apnProvider, {username: userData.username, postData});
    };
  
    await shutdownAPNProvider(apnProvider)
}

/* notifications from a new post, for quoted user */
async function pushQuoteNotification(apnProvider, {username, postData}) {
    const subtitle = `@${username} quoted your post!`
    
    await sendPushAppleNotification(apnProvider, { 
        userID: postData.quoteData.userID, 
        type: "quotes",
        notification: { title: "Interact Quote", subtitle, body: postData.content }
    })
}

/* notifications from a new post, for replied user */
async function pushReplyNotification(apnProvider, {username, postData}) {
    const subtitle = `@${username} replied to your post!`
    
    await sendPushAppleNotification(apnProvider, { 
        userID: postData.replyData.userID, 
        type: "replies",
        notification: { title: "Interact Reply", subtitle, body: postData.content }
    })
}

module.exports = {
    coposterRequestNotification,
    pushLikeNotifications,
    allNewPostNotifications
};