const mongoose = require('mongoose');
const { reqNum, reqString, nonreqNum, nonreqString } = require('../../types');

const interactArticleHubSectionSchema = mongoose.Schema({
    _id: reqString, // articleHubSectionID
    articleHubID: reqString,
    sectionName: reqString,
    sectionDescription: reqString,
    timestamp: reqNum,
    timestampEdited: nonreqNum,
    imgURL: nonreqString,
    homeArticle: nonreqString, // defaults to newest
    indexID: nonreqString // latest index with articles
});

module.exports = mongoose.model('interact-article-hub-section', interactArticleHubSectionSchema);