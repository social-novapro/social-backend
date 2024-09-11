const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactUserSearchSchema = mongoose.Schema({
    _id: reqString, // userID
    timestamp: reqNum, // date last changed
    preferredSearch: reqString // version of search
});

module.exports = mongoose.model('interact-user-search', interactUserSearchSchema);