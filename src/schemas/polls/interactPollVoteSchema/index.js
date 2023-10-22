const mongoose = require('mongoose');
const { reqString, reqNum, nonreqNum } = require('../../types');

/*
    votes which are linked to indexIDs
    you can search for a certian user by userID, and pollID
*/
const interactPollVoteSchema = mongoose.Schema({
    _id: reqString, // pollVoteID, linked inside pollVoteIndex
    _version: reqNum,
    pollID: reqString, // pollID
    userID: reqString, // userID
    lastEdited: nonreqNum, // time last changed
    timestamp: reqNum, // time voted
    pollIndexID: reqString, // indexID
    pollOptionID: reqString // pollOptionID
});

module.exports = mongoose.model('interact-poll-vote', interactPollVoteSchema);