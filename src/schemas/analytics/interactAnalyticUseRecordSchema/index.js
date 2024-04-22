const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactAnalyticUseRecordSchema = mongoose.Schema({
   _id: reqString,
   analyticUserID: reqString, // default: 'unknown'
   indexID: reqString,
   timestamp: reqNum,
   url_base: reqString,
   url_full: reqString
});

module.exports = mongoose.model('interact-analytic-use-record', interactAnalyticUseRecordSchema);