const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const interactMainSchema = mongoose.Schema({
    _id: reqString,
    currentUserID: reqString,
    currentPostID: reqString
});

module.exports = mongoose.model('interact-main', interactMainSchema)