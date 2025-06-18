const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString } = require('../../types');

const interactCategoryUserSchema = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString,
    categoryID: reqNum, // ID of the category
    userScore: reqNum,
    timestamp: reqNum, // last edited
});

module.exports = mongoose.model('interact-category-user', interactCategoryUserSchema);