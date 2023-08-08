const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: false
}
const nonreqString = {
    type: String,
    required: false
}
const nonreqNum = {
    type: Number,
    required: false
}

const interactErrorSchema = mongoose.Schema({
    _id: reqString, // errorID
    userID: reqString,
    errorCode: reqString,
    errorMsg: reqString,
    timestamp: reqNum,
    resolved: reqBool,
    reviewed: reqBool,
    reviewedBy: nonreqString,
    reviewedTimestamp: nonreqNum
    /* errorID	userID	username	errorCode	timestamp	reviewed	resolved	reviewedBy	reviewedTimestamp */
});

module.exports = mongoose.model('interact-error', interactErrorSchema);