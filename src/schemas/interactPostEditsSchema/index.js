const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};

const reqBool = {
    type: Boolean,
    required: true
};

const editSchema = {
    timestamp: reqString,
    content: reqString
}

const interactPostEditsSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    edits: [editSchema]
});


module.exports = mongoose.model('interact-post-edits', interactPostEditsSchema);