const mongoose = require('mongoose');
const { reqString, reqNum } = require('../types');

const interactUserAccessSchema = mongoose.Schema({
    _id: reqString, 
    userToken: reqString,
    userID: reqString,
    appToken: reqString,
    creationTimestamp: reqNum
});

module.exports = mongoose.model('interact-user-access', interactUserAccessSchema);