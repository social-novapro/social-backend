const mongoose = require('mongoose');
const { reqString } = require('../../types');

const interactUserNotifications = mongoose.Schema({
    _id: reqString, // userid
    notifications: [reqString] // notificationID
});

module.exports = mongoose.model('interact-user-notifications', interactUserNotifications);