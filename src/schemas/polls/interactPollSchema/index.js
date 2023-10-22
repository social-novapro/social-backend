const mongoose = require('mongoose');
const { nonreqString, nonreqNum, reqNum, reqString } = require('../../types');

const pollOptions = mongoose.Schema({
    _id: nonreqString, // pollOptionID
    optionTitle: nonreqString,
    timestamp: nonreqNum, // time added option (maybe can add option later)
    currentIndexID: nonreqString, // pollVoteIndexID (changes)
    amountVoted: nonreqNum // amount of votes
});

/*
    actual polls, which are linked to posts
*/
const interactPollSchema = mongoose.Schema({
    _id: reqString, // pollID
    _version: reqNum,
    timestamp: reqNum, // time posted
    userID: reqString, // userID of original
    postID: nonreqString, // main linked PostID (can be linked to other posts)
    timestampEnding: reqNum, // time poll ends
    lastEdited: nonreqNum, // time last edited
    pollName: reqString,
    pollOptions: [pollOptions] 
});

module.exports = mongoose.model('interact-poll', interactPollSchema);