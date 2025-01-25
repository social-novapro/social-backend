const mongoose = require('mongoose');
const { reqString, nonreqString, reqNum } = require('../../types');

const postIndexSchema = mongoose.Schema({
    _id: reqString, // postID
});

const interactUserPostIndexSchema = mongoose.Schema({
    _id: reqString, // UUID
    userID: reqString, // user id
    timestamp: reqNum, // timestamp of index
    amount: reqNum, // amount of posts
    prevIndexID: nonreqString, // previous index id
    nextIndexID: nonreqString, // next index id
    postIDs: [postIndexSchema] // post ids
});

module.exports = mongoose.model('interact-user-post-index', interactUserPostIndexSchema);
