const mongoose = require('mongoose');
const { reqString, nonreqString } = require('../../types');


const interactAnalyticUserSchema = mongoose.Schema({
   _id: reqString, // userID
   analyticUserID: reqString,
   indexID: nonreqString // current
});

module.exports = mongoose.model('interact-analytic-user', interactAnalyticUserSchema);