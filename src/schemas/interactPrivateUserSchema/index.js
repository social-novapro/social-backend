const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}
const reqNum = {
    type: Number,
    required: true
}

const interactUserPrivSchema = mongoose.Schema({
    _id: reqString,
    userToken: reqString,
    accessToken: reqString
});

module.exports = mongoose.model('interact-user-priv', interactUserPrivSchema)