const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const reqBool = {
    type: Boolean,
    required: true
};

const developerToken = mongoose.Schema({
   _id: reqString,
   userID: reqString,
   premium: reqBool,
   APIUses: reqNum,
   createdTimestamp: reqString,
   apps: [ reqString ]
});

module.exports = mongoose.model('developer-token', developerToken);