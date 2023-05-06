const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonReqstring = {
    type: String,
    required: false
}
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};

const interactAlertUser = mongoose.Schema({
    _id: reqString,
    lastSeenAlert: reqString,
    dismissed: reqBool,
    timestamp: reqNum,
    type: reqNum,
    userID: reqString,
    postID: nonReqstring
});

module.exports = mongoose.model('interact-alert-user', interactAlertUser);