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

const reviewHistorySchema = mongoose.Schema({ 
    _id: reqString, //random ID
    reviewBy: reqString,
    reviewStart: reqNum, // timestamp orignally started
    reviewEnd: reqNum, // timestamp replaced
    resolvedTimestamp: nonreqNum
});

const interactAdminErrorSchema = mongoose.Schema({
    _id: reqString, // errorID
    userID: reqString,
    errorVersion: reqNum,
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
    reviewTimestamp: nonreqNum,

    reviewHistory: [reviewHistorySchema]
});

module.exports = mongoose.model('interact-admin-error', interactAdminErrorSchema);