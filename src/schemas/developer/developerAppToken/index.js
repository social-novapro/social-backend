const mongoose = require('mongoose');
const { reqString, reqNum, nonreqNum, nonreqString } = require('../../types');

const developerAppToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   devToken: reqString,
   appName: nonreqString,
   APIUses: reqNum,
   creationTimestamp: nonreqNum,
});

module.exports = mongoose.model('developer-app-token', developerAppToken);