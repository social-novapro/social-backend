const { searchError } = require("../../searchError");
const interactUserNotifications = require('../../../schemas/notifications/interactUserNotifications');
const interactNotifications = require('../../../schemas/notifications/interactNotifications');
const {v4 : uuidv4} = require('uuid');
const {checktime} = require('../../checktime') 

async function pushNotification(notification) {
    const newID = uuidv4();

    await interactNotifications.findOneAndUpdate(
        {
            _id: newID
        }, {
            _id: newID,
            timestamp: checktime(),
            type: notification.type,
            userID: notification.userID ? notification.userID : null,
            postID: notification.postID ? notification.postID : null
        }, {
            upsert: true
        }
    )

    const notfi = await interactNotifications.findOne({_id: newID})

    return notfi;
};

module.exports = { pushNotification };