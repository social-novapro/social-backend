const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqString } = require('../../types');

// for v1.7, can support this by adding a version field to the schema
// now acts as a index for the notifications, instead of just a list of every notification
// this makes it have support for pagination, and old notifications can still be accessed
const interactUserNotifications = mongoose.Schema({
    _id: reqString, // userid (<v1.7) and UUID (>v1.7)
    userID: reqString, // userid
    version: reqNum, // version, <v1.7 is null/0, >v1.7 is 2
    notifications: [reqString], // notificationID
    count: reqNum,
    current: reqBool,
    prevIndex: nonreqString,
    nextIndex: nonreqString
});

module.exports = mongoose.model('interact-user-notifications', interactUserNotifications);