const mongoose = require('mongoose');
const { reqNum, reqString, nonreqNum } = require('../../types');

const interactEmbedPostSchema = mongoose.Schema({
    _id: reqString, // postID
    version: nonreqNum,
    userID: reqString,
    timestamp: reqNum,
    content: reqString,
    embedding: reqString,
});

module.exports = mongoose.model('interact-embed-post', interactEmbedPostSchema);