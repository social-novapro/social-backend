const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const interactUserPrivSchema = mongoose.Schema({
    _id: reqString,
    userToken: reqString,
    accessToken: [reqString],
    developerToken: reqString
});

module.exports = mongoose.model('interact-user-priv', interactUserPrivSchema)