const mongoose = require('mongoose');
const { reqString, nonreqNum } = require('../../types');

const interactEmbedSentenceSchema = mongoose.Schema({
    _id: reqString, // uuid \ sentenceID
    version: nonreqNum,
    sentence: reqString,
    embedding: reqString,
});

module.exports = mongoose.model('interact-embed-sentence', interactEmbedSentenceSchema);