const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqString } = require('../../types');

const notificationDataSchema = mongoose.Schema({
    title: reqString,
    subtitle: reqString,
    body: reqString
});

const interactDeviceNotification = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString, // userID
    timestamp: reqNum, // timestamp of device notification
    notificationId: reqString, // notificationId
    success: reqBool, // success
    deviceType: reqString, // deviceType
    title: nonreqString,
    subtitle: nonreqString,
    body: nonreqString,
    //notificationData: notificationDataSchema
});

module.exports = mongoose.model('interact-device-notification-schema', interactDeviceNotification);