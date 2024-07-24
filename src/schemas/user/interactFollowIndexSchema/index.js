const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString, reqBool } = require('../../types');

const interactFollowIndexSchema = mongoose.Schema({
    _id: reqString, // uuid, followIndexID
    userID: reqString, // userID (of person who got followed)
    type: reqNum, // 0 = following, 1 = followers
    prevIndexID: nonreqString,
    nextIndexID: nonreqString,
    current: reqBool,
    amount: reqNum, // amount
    timestamp: reqNum, // timestamp of index creation
    follows: [reqString]  // followID, uuid
});

module.exports = mongoose.model('interact-follow-index-schema', interactFollowIndexSchema);