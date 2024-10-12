const mongoose = require('mongoose');
const { reqNum, reqString, nonreqNum } = require('../../types');

const interactArticleSchema = mongoose.Schema({
    _id: reqString, // articleID
    hubID: reqString, // which articleHub
    topicID: reqString, // which hub topic
    userID: reqString, // who posted
    indexID: reqString,
    timestamp: reqNum,
    timestampEdited: nonreqNum,
    title: reqString
});

module.exports = mongoose.model('interact-article', interactArticleSchema);