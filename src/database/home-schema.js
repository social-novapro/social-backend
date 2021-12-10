const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const interactHomeSchema = mongoose.Schema({
    _id: reqString,
    posts: [ reqString ]
});

module.exports = mongoose.model('interact-home', interactHomeSchema)