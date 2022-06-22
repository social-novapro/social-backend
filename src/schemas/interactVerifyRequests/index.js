const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const interactVerifyRequests = mongoose.Schema({
    _id: reqString, // userid
    content: reqString, // description of request
    timestamp: reqString, // time requested
});

module.exports = mongoose.model('interact-verify-requests', interactVerifyRequests);