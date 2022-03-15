const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
}

const reqNum = {
    type: Number,
    required: true
}

const userConnectionsSchema = {
    _id: reqString,
    timestamp: reqString,
    api_urlbase: reqString,
    api_url: reqString,
}

const interactUserAnalyticSchema = mongoose.Schema({
   _id: reqString,
   userConnections: [ userConnectionsSchema ]
});

module.exports = mongoose.model('analytics-interact-user-usage', interactUserAnalyticSchema);