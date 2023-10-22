const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString } = require('../../types');

const interactAdminIndexSchema = mongoose.Schema({
    _id: reqString, // "main"
    issueErrorIndex: nonreqString,
    timestamp: reqNum
});

module.exports = mongoose.model('interact-admin-index', interactAdminIndexSchema);