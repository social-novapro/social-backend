const mongoose = require('mongoose');
const { reqString, reqNum, reqBool } = require('../../types');

const likeSchema = mongoose.Schema({
    // userID of person who liked
    _id: reqString,
    timeStamp: reqNum,
});

const interactPostLikeIndex = mongoose.Schema({
    _id: reqString, // uuid -- indexLikeID
    timestamp: reqNum,
    uuid: reqString, // postID OR userID
    type: reqNum, // 0 = post, 1 = user
    nextIndexID: reqString, 
    prevIndexID: reqString,
    current: reqBool,
    count: reqNum,
    likes: [ reqString] // likeIDs 
});

module.exports = mongoose.model('interact-post-like-index', interactPostLikeIndex);