const mongoose = require('mongoose');
const { reqString } = require('../../types');

const interactEmbedSentenceSchema = mongoose.Schema({
    _id: reqString, // uuid \ sentenceID
    sentence: reqString,
    embedding: reqString,
});

module.exports = mongoose.model('interact-embed-sentence', interactEmbedSentenceSchema);