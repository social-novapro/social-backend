const mongoose = require('mongoose');
const { reqString, reqBool, reqNum } = require('../../types');

const developerToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   premium: reqBool,
   APIUses: reqNum,
   creationTimestamp: reqString,
   apps: [ reqString ]
});

module.exports = mongoose.model('developer-token', developerToken);