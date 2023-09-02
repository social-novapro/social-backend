const {pushNotification} = require('../pushNotification')
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const {emailNotification} = require('../emailNotification');
const { searchErrorV2 } = require('../../searchError');

async function pushNewPost(userID, postID) {
    const hasFound = await interactSubscribeNotification.findOne({_id: userID})
    if (!hasFound || !hasFound.subscribed || !hasFound.subscribed[0]) return searchErrorV2("L012", { userID })

    const pushNoti = await pushNotification({ userID, postID, type: 5 })

    for (const user of hasFound.subscribed) {
        await interactUserNotifications.findOneAndUpdate( 
            { _id: user._id },
            { $push : { "notifications" : pushNoti._id}},
            { upsert: true }
        );

        await emailNotification({ userID: user._id, posterUserID: userID, postID })
    }
};

module.exports = {pushNewPost};