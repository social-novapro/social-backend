const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactPostSeenSchema = mongoose.Schema({
    _id: reqString, // uuid
    postID: reqString,
    userID: reqString,
    userPostIndexID: reqString, // userIndexID
    timestamp: reqNum,
});

module.exports = mongoose.model('interact-post-seen', interactPostSeenSchema);