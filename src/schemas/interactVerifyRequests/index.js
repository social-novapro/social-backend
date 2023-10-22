const mongoose = require('mongoose');
const { reqString } = require('../types');

const interactVerifyRequests = mongoose.Schema({
    _id: reqString, // userid
    content: reqString, // description of request
    timestamp: reqString, // time requested
    status: reqString, // pending, approved, denied
});

module.exports = mongoose.model('interact-verify-requests', interactVerifyRequests);