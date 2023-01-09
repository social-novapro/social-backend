const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const interactVerificationSchema = mongoose.Schema({
    _id: reqString, // userid
    content: reqString, // description of request
    timestamp: reqString, // time requested
    dismissed: reqNum, // 0 = not dismissed, 1 = dismissed
    acceptedBy: reqString, // id of admin who accepted request
    acceptedTimestamp: reqString, // time request was accepted
});

module.exports = mongoose.model('interact-verification', interactVerificationSchema);