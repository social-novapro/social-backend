// const {pushNotification} = require('../pushNotification')
// const interactSubscribeNotification = require('../../../schemas/notifications/interactSubscribeNotification');
// const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
// const { dismissNotification } = require('../dismissNotification');

const interactNotifications = require("../../../schemas/notifications/interactNotifications");
const interactUserNotifications = require("../../../schemas/notifications/interactUserNotifications");

async function deletePostNotifications({postID}) {
    /*
        steps
            check if notificaitonID exists for postID

            check for everyone who has the notifiactionID in their "inbox" + remove the notificaiton
    */
    const foundNotifcation = await interactNotifications.findOne({ postID: postID });
    if (!foundNotifcation) return console.log("not fonud?");

    const usersNotified = await interactUserNotifications.find({ "notifications" : foundNotifcation._id });
    if (!usersNotified || !usersNotified[0]) return console.log("not found 3?")

    for (const notif of usersNotified) {
        await interactUserNotifications.findOneAndUpdate({
            _id: notif._id 
        }, { 
            $pull : { "notifications" : foundNotifcation._id } 
        })
    }
    
    await interactNotifications.findOneAndDelete({ _id: foundNotifcation._id });
};

module.exports = { deletePostNotifications };