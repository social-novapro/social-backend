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

const interactPostSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    timePosted: reqString,
    content: reqString,
    totalLikes: reqNum,
    totalReplies: reqNum,
    edited: reqBool,
    editedTimestamp: reqString,
    editedAmount: reqNum
});

module.exports = mongoose.model('interact-post', interactPostSchema);