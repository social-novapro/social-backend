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

const interactAlertPost = mongoose.Schema({
    _id: reqString,
    type: reqNum, // wont be used yet, but could be used for unqiue styling
    title: reqString,
    body: reqString,
    publish_timestamp: reqNum,
    ending_timestamp: reqNum, // +1 day default
    userID: reqString, // who posted alert
    postID: nonReqstring // linked post?
});

module.exports = mongoose.model('interact-alert-post', interactAlertPost);