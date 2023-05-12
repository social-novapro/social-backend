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

const pollOptions = mongoose.Schema({
    _id: reqString, // pollOptionID
    pollName: reqString,
    pollOptions: [reqString],
    pollVotes: [reqString], // userID
    pollVotesCount: [reqString], // userID
    currentIndexID: reqString // pollVoteIndexID (changes)
});

/*
    actual polls, which are linked to posts
*/
const interactPollSchema = mongoose.Schema({
    _id: reqString, // pollID
    timestamp: reqNum, // time posted
    postID: reqString, // main linked PostID (can be linked to other posts)
    timestampEnding: reqNum, // time poll ends
    pollName: reqString,
    pollOptions: [pollOptions] 
});

module.exports = mongoose.model('interact-poll', interactPollSchema);