const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString } = require('../../types');

const interactCategorySchema = mongoose.Schema({
    _id: reqString, // uuid
    name: reqString,
    timestamp: reqNum,
    isSubCategory: reqBool,
    parentCategory: nonreqString,
    embedding: nonreqString
});

module.exports = mongoose.model('interact-category', interactCategorySchema);