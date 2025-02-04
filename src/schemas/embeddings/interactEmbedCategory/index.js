const mongoose = require('mongoose');
const { reqNum, reqString } = require('../../types');

const interactEmbedCategorySchema = mongoose.Schema({
    _id: reqString, // categoryID
    timestamp: reqNum,
    embedding: reqString,
});

module.exports = mongoose.model('interact-embed-category', interactEmbedCategorySchema);