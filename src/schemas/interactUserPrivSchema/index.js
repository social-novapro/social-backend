const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}
const nonreqString = {
    type: String,
    required: false
}

const interactUserPrivSchema = mongoose.Schema({
    _id: reqString,
    userToken: reqString,
    accessTokens: [reqString],
    password: reqString,
    devToken: nonreqString
});

module.exports = mongoose.model('interact-user-priv', interactUserPrivSchema)