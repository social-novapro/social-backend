const mongoose = require('mongoose');
const { reqString, reqBool, nonreqNum } = require('../../types');

const developerToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   premium: reqBool,
   APIUses: nonreqNum,
   creationTimestamp: nonreqNum,
   apps: [ reqString ]
});

module.exports = mongoose.model('developer-token', developerToken);