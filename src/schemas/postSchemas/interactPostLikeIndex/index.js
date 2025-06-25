const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqString } = require('../../types');

const interactPostLikeIndex = mongoose.Schema({
    _id: reqString, // uuid -- indexLikeID
    timestamp: reqNum,
    uuid: reqString, // postID OR userID
    type: reqNum, // 0 = post, 1 = user
    nextIndexID: nonreqString, 
    prevIndexID: nonreqString,
    current: reqBool,
    count: reqNum,
    likes: [ reqString] // likeIDs 
});

module.exports = mongoose.model('interact-post-like-index', interactPostLikeIndex);