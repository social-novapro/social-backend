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
const nonReqNum = {
    type: Number,
    required: false
} 
const reqBool = {
    type: Boolean,
    required: true
};

const interactAlertPost = mongoose.Schema({
    _id: reqString,
    type: reqNum, // wont be used yet, but could be used for unqiue styling
    systemID: reqString,
    indexID: reqString,
    title: nonReqstring,
    content: reqString,
    publish_timestamp: reqNum,
    ending_timestamp: reqNum, // +1 day default
    userID: reqString, // who posted alert
    postID: nonReqstring, // linked post?
    isArchived: reqBool,
    archived_timestamp: nonReqNum,
    lastEdited: nonReqNum
});

module.exports = mongoose.model('interact-alert-post', interactAlertPost);