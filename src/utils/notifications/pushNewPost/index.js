const {pushNotification} = require('../pushNotification')
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const {emailNotification} = require('../emailNotification');
const { searchErrorV2 } = require('../../searchError');
const { sendPushAppleNotification } = require('../../pushNotifications/apnProvider');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactPostSchema = require('../../../schemas/interactPostSchema');

async function pushNewPost(userID, postID) {
    const hasFound = await interactSubscribeNotification.findOne({_id: userID})
    const foundUser = await interactUserSchema.findOne({_id: userID})
    const newPost = await interactPostSchema.findOne({_id: postID})

    if (!hasFound || !hasFound.subscribed || !hasFound.subscribed[0]) return searchErrorV2("L012", { userID })

    const pushNoti = await pushNotification({ userID, postID, type: 5 })

    for (const user of hasFound.subscribed) {
        await interactUserNotifications.findOneAndUpdate( 
            { _id: user._id },
            { $push : { "notifications" : pushNoti._id}},
            { upsert: true }
        );

        await emailNotification({ userID: user._id, posterUserID: userID, postID })
        const subtitle = `New Post from @${foundUser.username}`
        const body = newPost.content
        await sendPushAppleNotification({ userID: user._id, notification: { subtitle, body }})
    }
};

module.exports = {pushNewPost};