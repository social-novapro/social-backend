const mongoose = require('mongoose');
const { nonreqString, reqString, reqNum } = require('../../types');

const voteSchema = mongoose.Schema({
    _id: nonreqString,
    // timestamp
})
/*
    votes which are linked to indexIDs
*/
const interactPollVoteIndexSchema = mongoose.Schema({
    _id: reqString, // pollVoteIndexID
    _version: reqNum,
    timestamp: reqNum, // time created
    votes: [voteSchema], // [pollVoteID]
    previousIndexID: nonreqString, // voteIndexID
    nextIndexID: nonreqString, // pollVoteIndexID
});

module.exports = mongoose.model('interact-poll-vote-index', interactPollVoteIndexSchema);