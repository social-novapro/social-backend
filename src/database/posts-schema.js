const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}
const reqBool = {
    type: Boolean,
    required: true
}
const replying = mongoose.Schema({
    // id of post replying to
    _id: reqString,
    // are you replying
    replying: reqBool
})

const interactPostSchema = mongoose.Schema({
    _id: reqString,
    // if the post is a reply
    replyingSchema: {
        type: replying,
        required: false
    },
    authorID: reqString,
    // authorID, for notfications
    timePosted: reqString,
    content: reqString,
    likes: reqString,
    // array of post id's
    comments: [ reqString ]
});

module.exports = mongoose.model('interact-post-old', interactPostSchema)