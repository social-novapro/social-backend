const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactDeviceTokenPush = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString, // userID
    deviceToken: reqString, // deviceToken
    timestamp: reqNum, // timestamp of device added
    deviceType: reqString, // deviceType
});

module.exports = mongoose.model('interact-device-token-push-schema', interactDeviceTokenPush);