const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleIndexSchema = mongoose.Schema({
    _id: reqString, // articleIndexID
    count: reqNum, 
    current: reqBool,
    prevIndexID: nonreqString,
    nextIndexID: nonreqString,
    articleID: reqString, // articleID its apart of
    typeID: reqNum
    /* what is it indexing?
        1. articles for articleFeed
        2. articles for articleHubSection
        3. comments for articles
        4. likes for articles/comments/hub
        5. replies for comments
    */
});

module.exports = mongoose.model('interact-article-index', interactArticleIndexSchema);