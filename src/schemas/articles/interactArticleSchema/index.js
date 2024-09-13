const mongoose = require('mongoose');
const { reqNum, reqString } = require('../../types');

const interactArticleSchema = mongoose.Schema({
    _id: reqString, // articleID
    hubID: reqString, // which articleHub
    sectionID: reqString, // which hubsection
    userID: reqString, // who posted
    indexID: reqString,
    timestamp: reqNum,
    timestampEdited: reqNum
});

module.exports = mongoose.model('interact-article', interactArticleSchema);