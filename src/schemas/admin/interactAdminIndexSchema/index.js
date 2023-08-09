const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};
const nonreqString = {
    type: String,
    required: false
}

const interactAdminIndexSchema = mongoose.Schema({
    _id: reqString, // "main"
    issueErrorIndex: nonreqString,
    timestamp: reqNum
});

module.exports = mongoose.model('interact-admin-index', interactAdminIndexSchema);