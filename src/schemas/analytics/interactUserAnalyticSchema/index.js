const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const userConnectionsSchema = {
    _id: reqString,
    timestamp: reqNum,
    api_urlbase: reqString,
    api_url: reqString,
}

const interactUserAnalyticSchema = mongoose.Schema({
   _id: reqString,
   userConnections: [ userConnectionsSchema ]
});

module.exports = mongoose.model('analytics-interact-user-usage', interactUserAnalyticSchema);