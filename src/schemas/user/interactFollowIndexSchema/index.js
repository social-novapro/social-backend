const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString } = require('../../types');

const interactFollowIndexSchema = mongoose.Schema({
    _id: reqString, // uuid, followIndexID
    userID: reqString, // userID (of person who got followed)
    type: reqNum, // 0 = following, 1 = followers
    prevIndexID: nonreqString,
    nextIndexID: nonreqString,
    current: reqNum,
    amount: reqNum, // amount
    timestamp: reqNum, // timestamp of index creation
    follow: [reqString]  // followID, uuid
});

module.exports = mongoose.model('interact-follow-index-schema', interactFollowIndexSchema);