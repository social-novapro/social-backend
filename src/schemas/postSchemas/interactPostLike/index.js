const mongoose = require('mongoose');
const { reqString, reqNum, reqBool } = require('../../types');

const interactPostLike = mongoose.Schema({
    _id: reqString, // uuid -- likeID
    postID: reqString,
    userID: reqString,
    userIndexID: reqString,
    postIndexID: reqString,
    active: reqBool,
    timestamp: reqNum,
});

module.exports = mongoose.model('interact-post-like', interactPostLike);