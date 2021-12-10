const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const interactUserAccessSchema = mongoose.Schema({
    _id: reqString, 
    userToken: reqString,
    userID: reqString,
    appToken: reqString
});

module.exports = mongoose.model('interact-user-access', interactUserAccessSchema)