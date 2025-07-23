const mongoose = require('mongoose');
const { reqString, reqNum, reqBool } = require('../../types');

const interactPostSeenSchema = mongoose.Schema({
    _id: reqString, // uuid
    postID: reqString,
    userID: reqString,
    userPostIndexID: reqString, // userIndexID
    timestamp: reqNum,
    current: reqBool
});

module.exports = mongoose.model('interact-post-seen', interactPostSeenSchema);