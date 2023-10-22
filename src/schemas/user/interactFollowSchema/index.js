const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const userFollow = mongoose.Schema({
    _id: reqString, // userID (of person who followed)
    timestamp: reqNum // time followed
});

const interactFollowSchema = mongoose.Schema({
    _id: reqString, // userID (of person who got followed)
    follow: [userFollow] 
});

module.exports = mongoose.model('interact-follow-schema', interactFollowSchema);