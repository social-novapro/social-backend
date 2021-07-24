const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}
const postIndex = mongoose.Schema({
    user: reqString,
    content: reqString,
    likes: reqString, 
    timePosted: reqString
})
const interactHomeSchema = mongoose.Schema({
    _id: reqString,
    posts: [ postIndex ]
});

module.exports = mongoose.model('interact-home', interactHomeSchema)