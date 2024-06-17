const mongoose = require('mongoose');
const { reqString, reqNum } = require('../types');

const interactVerificationSchema = mongoose.Schema({
    _id: reqString, // userid
    content: reqString, // description of request
    timestamp: reqNum, // time requested
    dismissed: reqNum, // 0 = not dismissed, 1 = dismissed
    acceptedBy: reqString, // id of admin who accepted request
    acceptedTimestamp: reqNum, // time request was accepted
});

module.exports = mongoose.model('interact-verification', interactVerificationSchema);