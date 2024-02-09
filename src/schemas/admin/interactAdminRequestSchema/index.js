const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString } = require('../../types');

const interactAdminRequestSchema = mongoose.Schema({
    _id: reqString, // requestID
    userID: reqString, // id of user requesting
    content: reqString, // description of request
    timestamp: reqNum, // time requested
    adminType: reqNum, // level of request
    status: reqNum, // 0 = not dismissed, 1 = dismissed, 2 = accepted
    acceptedBy: nonreqString, // id of admin who accepted request
    acceptedTimestamp: nonreqString, // time request was accepted
});

module.exports = mongoose.model('interact-admin-requests', interactAdminRequestSchema);