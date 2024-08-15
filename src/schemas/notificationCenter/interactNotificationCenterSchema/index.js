// interactNotificationCenterSchema
const mongoose = require('mongoose');
const { reqString, nonreqString, reqNum, reqBool } = require('../../types');

const interactNotificationCenterSchema = mongoose.Schema({
    _id: reqString, // notifUUID
    dismissed: reqBool,
    read: reqBool,
    revoked: reqBool, // was it undone by other side
    notifType: reqNum,
    userID: reqString,
    indexID: reqString, // for user side
    timestamp: reqNum,
    timestampDismissed: nonreqString,
});

module.exports = mongoose.model('interact-notification-center', interactNotificationCenterSchema);