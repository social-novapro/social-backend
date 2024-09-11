const mongoose = require('mongoose');
const { reqString } = require('../../types');

const interactEmbedSentencePostSchema = mongoose.Schema({
    _id: reqString, // uuid
    postID: reqString,
    sentenceID: reqString,
});

module.exports = mongoose.model('interact-embed-sentence-post', interactEmbedSentencePostSchema);