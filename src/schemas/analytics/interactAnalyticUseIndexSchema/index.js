const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactAnalyticUseIndexSchema = mongoose.Schema({
   _id: reqString,
   timestamp: reqNum,
   analyticUserID: reqString,
   prevIndexID: reqString,
   nextIndexID: reqString,
});

module.exports = mongoose.model('interact-analytic-user-index', interactAnalyticUseIndexSchema);