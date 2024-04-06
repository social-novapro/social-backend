const mongoose = require('mongoose');
const { reqNum, reqString } = require('../../types');

const interactEmbedPostSchema = mongoose.Schema({
    _id: reqString, // postID
    userID: reqString,
    timestamp: reqNum,
    content: reqString,
    embedding: reqString,
});

module.exports = mongoose.model('interact-embed-post', interactEmbedPostSchema);