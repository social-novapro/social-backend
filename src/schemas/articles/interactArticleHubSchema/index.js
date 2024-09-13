const mongoose = require('mongoose');
const { reqNum, reqString, nonreqNum, nonreqString } = require('../../types');

const interactArticleHubSchema = mongoose.Schema({
    _id: reqString, // articleHubID
    ownerID: reqString, // userID or org
    hubName: reqString,
    hubDescription: reqString,
    pinnedArticle: nonreqString,
    headerURL: nonreqString,
    imgURL: nonreqString,
    homeArticle: nonreqString, // defaults to newest
    timestamp: reqNum,
    timestampEdited: nonreqNum
});

module.exports = mongoose.model('interact-article-hub', interactArticleHubSchema);