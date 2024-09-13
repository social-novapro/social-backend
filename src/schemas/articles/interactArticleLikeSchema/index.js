const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleLikeSchema = mongoose.Schema({
    _id: reqString, // articleLikeID
    indexID: reqString, 
    userID: reqString, // who liked
    contentID: reqString,
    typeID: reqNum
    /* what is being liked?
        1. article
        2. hub
        3. comment
        4. hub-section
    */
});

module.exports = mongoose.model('interact-article-like', interactArticleLikeSchema);