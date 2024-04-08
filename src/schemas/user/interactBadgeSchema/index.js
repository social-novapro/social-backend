const mongoose = require('mongoose');
const { reqString, reqNum, nonreqNum } = require('../../types');

const interactBadgeSchema = mongoose.Schema({
    _id: reqString, // unqiue ID
    userID: reqString,
    badgeID: reqString,
    timestamp: reqNum, // time added
    latest_timestamp: nonreqNum, // time last updated
    count: reqNum,
});

module.exports = mongoose.model('interact-badge-schema', interactBadgeSchema);