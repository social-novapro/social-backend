// interactNotificationCenterSchema
const mongoose = require('mongoose');
const { reqString, nonreqString, reqNum, reqBool } = require('../../types');

const interactSystemData = mongoose.Schema({
    _id: reqNum, //1,2,3 // id of system type,
    subject: nonreqString, // 1, 2
    content: nonreqString, // 1
    htmlP: nonreqString, // 2
    htmlA: nonreqString, // 2
    title: nonreqString, // 3
    subtitle: nonreqString, // 3
    body: nonreqString, // 3
});

const interactNotificationCenterTypeSchema = mongoose.Schema({
    _id: reqNum, // id of type
    timestamp: reqNum, // timestamp added type
    name: reqString, // name of type
    description: nonreqString, // description of type
    required: reqBool, // if type is required
    esstential: reqBool, // if type is essential
    pushToSystem: [interactSystemData],
    systemTypes: [reqNum], // system types that use this type
});

module.exports = mongoose.model('interact-notification-center-type', interactNotificationCenterTypeSchema);