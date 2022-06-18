const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};

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