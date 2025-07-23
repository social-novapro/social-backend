const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString, nonreqBool } = require('../../types');

const postIndexSchema = mongoose.Schema({
    _id: reqString, // postID
});

const interactPostIndexSchema = mongoose.Schema({
    _id: reqString, // indexid
    timestamp: reqNum,
    nextIndexID: nonreqString, // next id
    prevIndexID: nonreqString, // prev id
    amount: reqNum, // amount of themes

    // this is for user specific indexes
    isUserSpecific: nonreqBool, // if this is a user specific index
    current: nonreqBool,
    shown: nonreqBool, // if shown in feed
    expired: nonreqBool, // if expired
    userID: nonreqString, // userID
    
    postIDs: [postIndexSchema]
});

module.exports = mongoose.model('interact-post-index', interactPostIndexSchema);
