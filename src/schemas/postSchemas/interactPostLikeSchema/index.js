const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const likeSchema = mongoose.Schema({
    // userID of person who liked
    _id: reqString,
    timeStamp: reqNum,
});

const interactPostLikeSchema = mongoose.Schema({
    // postID
    _id: reqString,
    peopleLiked: [ likeSchema ]
});

module.exports = mongoose.model('interact-post-like-schema', interactPostLikeSchema);