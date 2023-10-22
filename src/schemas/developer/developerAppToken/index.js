const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const developerAppToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   devToken: reqString,
   appName: reqString,
   APIUses: reqNum,
   creationTimestamp: reqString,
});

module.exports = mongoose.model('developer-app-token', developerAppToken);