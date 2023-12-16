const mongoose = require('mongoose');
const { reqString, reqBool, reqNum, nonreqNum } = require('../../types');

const interactPostCoSchema = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString,
    postID: reqString,
    timestamp: reqNum,
    deletedPost: reqBool, // if post is deleted
    declined: reqBool, // if user declined
    approved: reqBool, // if user approved
    approvedTimestamp: nonreqNum, // timestamp user approved
});

module.exports = mongoose.model('interact-post-coposter', interactPostCoSchema);