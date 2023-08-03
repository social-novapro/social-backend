const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const intearctUserFeedSchema = mongoose.Schema({
    _id: reqString, // userID
    timestamp: reqNum, // date last changed
    preferredFeed: reqString // name of feed
});

module.exports = mongoose.model('interact-user-feed-schema', intearctUserFeedSchema);