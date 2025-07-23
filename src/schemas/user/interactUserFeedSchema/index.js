const mongoose = require('mongoose');
const { reqString, reqNum, reqBool } = require('../../types');

const intearctUserFeedSchema = mongoose.Schema({
    _id: reqString, // userID
    timestamp: reqNum, // date last changed
    preferredFeed: reqString, // name of feed
    isUserSet: reqBool
});

module.exports = mongoose.model('interact-user-feed', intearctUserFeedSchema);