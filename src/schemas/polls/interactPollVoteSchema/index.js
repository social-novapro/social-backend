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
const interactPollVoteSchema = mongoose.Schema({
    _id: reqString, // pollVoteID
    pollID: reqString, // pollID
    userID: reqString, // userID
    timestamp: reqNum, // time voted
    pollOptionID: reqString // pollOptionID
});

module.exports = mongoose.model('interact-poll-vote', interactPollVoteSchema);