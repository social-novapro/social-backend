// interactNotificationCenterSchema
const mongoose = require('mongoose');
const { reqString, nonreqString, reqNum, reqBool } = require('../../types');

const interactSystemData = mongoose.Schema({
    _id: reqNum, //1, // id of system type,
    content: nonreqString, // 1, 2
    subject: nonreqString, // 2
    title: nonreqString, // 3
    subtitle: nonreqString, // 3
    body: nonreqString, // 3
});

const interactNotificationCenterTypeSchema = mongoose.Schema({
    _id: reqNum, // id of type
    timestamp: reqNum, // timestamp added type
    name: reqString, // name of type
    description: nonreqString, // description of type
    pushToSystem: [interactSystemData],
});

module.exports = mongoose.model('interact-notification-center-type', interactNotificationCenterTypeSchema);