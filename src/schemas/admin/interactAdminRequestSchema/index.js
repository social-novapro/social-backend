const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const interactAdminRequestSchema = mongoose.Schema({
    _id: reqString, // userid
    content: reqString, // description of request
    timestamp: reqString, // time requested
    adminType: reqNum, // level of request
    dismissed: reqNum, // 0 = not dismissed, 1 = dismissed
    acceptedBy: reqString, // id of admin who accepted request
    acceptedTimestamp: reqString, // time request was accepted
});

module.exports = mongoose.model('interact-admin-requests', interactAdminRequestSchema);