const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString, reqBool } = require('../../types');

const interactPostTagIndexSchema = mongoose.Schema({
    _id: reqString, // index UUID
    current: reqBool, // is this the current index
    tagText: reqString, // tag text (user or hastag)
    timestamp: reqNum, // time created index
    count: reqNum, // total count of posts
    tagType: reqNum, // 0 = user, 1 = hashtag
    prevIndexID: nonreqString, // previous index UUID
    nextIndexID: nonreqString, // next index UUID
    tagIDs: [reqString], // tag ids (links to interact-post-tag)
    postIDs: [reqString], // post ids (links to interact-post)
});

module.exports = mongoose.model('interact-post-tag-index', interactPostTagIndexSchema);