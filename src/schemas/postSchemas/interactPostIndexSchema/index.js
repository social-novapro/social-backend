const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString } = require('../../types');

const postIndexSchema = mongoose.Schema({
    _id: reqString, // postID
});

const interactPostIndexSchema = mongoose.Schema({
    _id: reqString, // indexid
    timestamp: reqNum,
    nextID: nonreqString, // next id
    prevID: nonreqString, // prev id
    amount: reqNum, // amount of themes
    postIDs: [postIndexSchema]
});

module.exports = mongoose.model('interact-post-index', interactPostIndexSchema);
