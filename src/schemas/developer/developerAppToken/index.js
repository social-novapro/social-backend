const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const reqNum = {
    type: Number,
    required: true
}

const developerAppToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   developerToken: reqString,
   APIUses: reqNum,
   createdTimestamp: reqString,
});

module.exports = mongoose.model('developer-app-token', developerAppToken)