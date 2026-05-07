const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum } = require('../../types');

const interactEmbedPostFailSchema = mongoose.Schema({
    _id: reqString,
    postID: reqString, // postID
    timestamp: reqNum,
    fixed: reqBool,
    reason: reqString,
    version: nonreqNum,
});

module.exports = mongoose.model('interact-embed-post-fail', interactEmbedPostFailSchema);