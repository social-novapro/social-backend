const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactPrivacySchema = mongoose.Schema({
    _id: reqString, // userID (of person who got followed)
    timestamp: reqNum, // time created privacy schema
    edited: reqNum,
   
    post: reqNum,
    profile: reqNum,
    follow: reqNum,
    theme: reqNum,
    message: reqNum,
    likes: reqNum,
    bookmarks: reqNum,
});

module.exports = mongoose.model('interact-privacy-schema', interactPrivacySchema);