const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString, reqBool } = require('../../types');

const interactPostTagIndexSchema = mongoose.Schema({
    _id: reqString, // index UUID
    current: reqBool, // is this the current index
    tagText: reqString, // tag text (user or hastag)
    timestamp: reqNum, // time created index
    count: reqNum, // total count of posts
    prevIndexID: nonreqString, // previous index UUID
    nextIndexID: nonreqString, // next index UUID
    tagIDs: [reqString], // tag ids
});

module.exports = mongoose.model('interact-post-tag-index', interactPostTagIndexSchema);