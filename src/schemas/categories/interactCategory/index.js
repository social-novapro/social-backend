const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString, nonreqNum } = require('../../types');

const interactCategorySchema = mongoose.Schema({
    _id: reqString, // uuid
    id: reqNum,
    name: reqString,
    timestamp: reqNum,
    version: reqNum,
    embeddingVersion: reqNum,
    isSubCategory: reqBool,
    parentCategoryID: nonreqNum,
    embedding: nonreqString
});

module.exports = mongoose.model('interact-category', interactCategorySchema);