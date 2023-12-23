const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const editSchema = {
    publicTimestamp: reqNum,
    removedTimestamp: reqNum,
    content: reqString
}

const interactPostEditSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    edits: [editSchema]
});

module.exports = mongoose.model('interact-post-edits', interactPostEditSchema);