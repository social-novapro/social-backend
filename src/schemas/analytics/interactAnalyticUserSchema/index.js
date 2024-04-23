const mongoose = require('mongoose');
const { reqString, nonreqString, reqNum } = require('../../types');

const interactAnalyticUserSchema = mongoose.Schema({
   _id: reqString, // userID
   analyticUserID: reqString,
   userID: reqString,
   indexID: nonreqString, // current
   timestamp: reqNum
});

module.exports = mongoose.model('interact-analytic-user', interactAnalyticUserSchema);