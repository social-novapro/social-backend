const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const interactUserNotifications = mongoose.Schema({
    _id: reqString, // userid
    notifications: [reqString] // notificationID
});


module.exports = mongoose.model('interact-user-notifications', interactUserNotifications);