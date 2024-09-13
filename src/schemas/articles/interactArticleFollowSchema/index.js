const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleFollowSchema = mongoose.Schema({
    _id: reqString, // articleFollowID
    userID: reqString, // user followed
    isSub: reqBool, // did user sub to notifs
    contentID: reqString, // contentID, hub or section
    type: reqNum 
    /* what is being followed
        1. hub
        2. hub section
    */
});

module.exports = mongoose.model('interact-article-follow', interactArticleFollowSchema);