const mongoose = require('mongoose');
const { reqString } = require('../../types');

const editSchema = {
    publicTimestamp: reqString,
    removedTimestamp: reqString,
    content: reqString
}

const interactPostEditSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    edits: [editSchema]
});

module.exports = mongoose.model('interact-post-edits', interactPostEditSchema);