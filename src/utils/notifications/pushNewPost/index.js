const {pushNotification} = require('../pushNotification')
const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
const { searchErrorV2 } = require('../../searchError');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const { allNewPostNotifications } = require('../../pushNotifications/postActionNotifications');

async function pushNewPost(userID, postID) {
    // new post's userID and postID
    const hasFound = await interactSubscribeNotification.findOne({_id: userID})
    const foundUser = await interactUserSchema.findOne({_id: userID})
    const newPost = await interactPostSchema.findOne({_id: postID})

    //if (!hasFound || !hasFound.subscribed || !hasFound.subscribed[0]) return searchErrorV2("L012", { userID })

    const pushNoti = await pushNotification({ userID, postID, type: 5 })

    allNewPostNotifications({ 
        userData: foundUser, 
        postData: newPost, 
        subscribedList: hasFound, 
        notificationData: pushNoti
    });
};

module.exports = {pushNewPost};