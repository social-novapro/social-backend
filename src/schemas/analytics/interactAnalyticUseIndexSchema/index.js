const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString, reqBool } = require('../../types');

const interactAnalyticUseIndexSchema = mongoose.Schema({
   _id: reqString,
   timestamp: reqNum,
   current: reqBool,
   count: reqNum,
   analyticUserID: reqString,
   prevIndexID: nonreqString,
   nextIndexID: nonreqString,
});

module.exports = mongoose.model('interact-analytic-use-index', interactAnalyticUseIndexSchema);