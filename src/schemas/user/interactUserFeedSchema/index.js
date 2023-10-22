const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const intearctUserFeedSchema = mongoose.Schema({
    _id: reqString, // userID
    timestamp: reqNum, // date last changed
    preferredFeed: reqString // name of feed
});

module.exports = mongoose.model('interact-user-feed', intearctUserFeedSchema);