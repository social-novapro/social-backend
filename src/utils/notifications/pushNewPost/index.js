const {pushNotification} = require('../pushNotification')
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');

async function pushNewPost(userID, postID) {
    const hasFound = await interactSubscribeNotification.findOne({_id: userID})
    if (!hasFound || !hasFound.subscribed || !hasFound.subscribed[0]) return console.log('none found')

    const pushNoti = await pushNotification({ userID, postID, type: 5 })

    for (const user of hasFound.subscribed) {
        await interactUserNotifications.findOneAndUpdate( 
            { _id: user._id },
            { $push : { "notifications" : pushNoti._id}},
            { upsert: true }
        );
    }
};

module.exports = {pushNewPost};