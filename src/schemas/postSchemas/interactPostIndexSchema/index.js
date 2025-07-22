const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString } = require('../../types');

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
    current: nonreqString,
    shown: nonreqString, // if shown in feed
    expired: nonreqString, // if expired
    userID: nonreqString, // userID
    
    postIDs: [postIndexSchema]
});

module.exports = mongoose.model('interact-post-index', interactPostIndexSchema);
