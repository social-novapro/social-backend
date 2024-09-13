const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleCommentSchema = mongoose.Schema({
    _id: reqString, // articleCommentID
    articleID: reqString, // articleID its apart of
    indexID: reqString,
    userID: reqString, // who posted
    content: reqString,
    timestamp: reqNum,
    /* like related */
    likeCount: reqNum,
    likeIndexID: nonreqString, // index for comment
    /* reply related */
    isReply: reqBool,
    replyCommentID: nonreqString
});

module.exports = mongoose.model('interact-article-comment', interactArticleCommentSchema);