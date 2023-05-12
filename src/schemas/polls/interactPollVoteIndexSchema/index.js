const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
};
const reqBool = {
    type: Boolean,
    required: false
};
const reqNum = {
    type: Number,
    required: false
};

/*
    votes which are linked to indexIDs
*/
const interactPollVoteIndexSchema = mongoose.Schema({
    _id: reqString, // pollVoteIndexID
    timestamp: reqNum, // time created
    index: [reqString], // [pollVoteID]
    previousIndexID: reqString, // voteIndexID
    nextIndexID: reqString, // pollVoteIndexID
});

module.exports = mongoose.model('interact-poll-vote-index', interactPollVoteIndexSchema);