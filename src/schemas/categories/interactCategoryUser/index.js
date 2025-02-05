const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString } = require('../../types');

const interactCategorySchema = mongoose.Schema({
    _id: reqNum, // uuid
    userID: reqString,
    timestamp: reqNum, // last edited
    categoryID: reqString, // ID of the category
    isSubCategory: reqBool, 
    parentCategoryID: nonreqString, // ID of the parent category
});

module.exports = mongoose.model('interact-category', interactCategorySchema);