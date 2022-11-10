const {pushNotification} = require('../pushNotification')
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');

async function pushQuotePost(userID, postID, quotingUserID) {
    const pushNoti = await pushNotification({ userID, postID, type: 7 })
    // user quoted your post! (click to see);

    await interactUserNotifications.findOneAndUpdate({
        _id: quotingUserID 
    }, { $push : { 
        "notifications" : pushNoti._id
    }}, { 
        upsert: true 
    });
    // const noti = await interactUserNotifications.findOne({_id: quotingUserID})
    // console.log(noti)
};

module.exports = { pushQuotePost };