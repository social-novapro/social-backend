const mongoose = require('mongoose');
const { reqString, nonreqNum } = require('../../types');

const interactEmbedSentencePostSchema = mongoose.Schema({
    _id: reqString, // uuid
    version: nonreqNum,
    postID: reqString,
    sentenceID: reqString,
});

module.exports = mongoose.model('interact-embed-sentence-post', interactEmbedSentencePostSchema);