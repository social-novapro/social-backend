const mongoose = require('mongoose');
const { reqNum, reqString } = require('../../types');

const interactPostTagSchema = mongoose.Schema({
    _id: reqString, // UUID
    tagTextOriginal: reqString, // tag text (with actual case)
    wordIndex: reqNum, // index of word in post
    timestamp: reqNum, // time posted
    indexID: reqString, // tagIndexID
    userID: reqString, // userID of poster
    postID: reqString, // postID of post with tag
});

module.exports = mongoose.model('interact-post-tag', interactPostTagSchema);
