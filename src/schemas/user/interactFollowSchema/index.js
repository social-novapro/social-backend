const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqNum } = require('../../types');

const interactFollowSchema = mongoose.Schema({
    _id: reqString, // uuid, followID
    timestamp: reqNum, // timestamp of the follow
    timestampUnfollow: nonreqNum, // if the user unfollowed
    current: reqBool, // if the user is currently following
    userID: reqString, // user that is following
    followedUserID: reqString, // user that was followed
    indexFollowingID: reqString, // index that follow is saved in (for following)
    indexFollowersID: reqString, // index that follow is saved in (for followers)
});

module.exports = mongoose.model('interact-follow-schema', interactFollowSchema);