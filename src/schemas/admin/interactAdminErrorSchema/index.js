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

const interactAdminErrorSchema = mongoose.Schema({
    _id: reqString, // errorID
    userID: reqString,
    errorCode: reqString,
    errorMsg: reqString,
    timestamp: reqNum,
    /*
        issue is in review
        then is resolved (or resolved if nothing to do)
    */
    resolved: reqBool,
    resolvedTimestamp: nonreqNum,
    
    inReview: reqBool,
    reviewedBy: nonreqString,
    reviewTimestamp: nonreqNum
});

module.exports = mongoose.model('interact-admin-error', interactAdminErrorSchema);