// interactNotificationCenterSchema
const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString } = require('../../types');

const interactNotificationCenterPreferenceSchema = mongoose.Schema({
    _id: reqString, // UUID
    type: reqNum, // id of type
    enabled: reqNum, // 0=disabled, 1=enabled
    userID: reqString, // user id
    timestamp: reqNum, // timestamp created preference
    timestampUpdated: reqNum, // timestamp updated preference
    deviceType: reqNum, // device type, 0=inapp, 1=email, 2=ios
});

module.exports = mongoose.model('interact-notification-center-preference', interactNotificationCenterPreferenceSchema);