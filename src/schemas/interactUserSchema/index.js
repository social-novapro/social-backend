const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqBool, nonreqNum, nonreqString } = require('../types');

// 1: public, 2: friends of friends, 3: private
const privacySettingSchema = mongoose.Schema({
    discoverSetting: reqNum,
    postVisiblityDefault: reqNum,
    postReplyDefault: reqNum,
});

// Theme data
const themeSchema = mongoose.Schema({
    themeID: reqString, // theme id
    testTheme: reqString, // theme id to test
    amountTested: reqNum, // amount of times tested
    testAmount: reqNum, // amount of times to test
});

// pinned posts
const pinnedPostsSchema = mongoose.Schema({
    _id: reqString, // user id
    timestamp: reqNum, // timestamp of pin
});

const interactUserSchema = mongoose.Schema({
    _id: reqString,
    username: reqString,
    usernameLc: reqString,
    displayName: reqString,
    description: reqString,
    creationTimestamp: reqNum,

    profileURL: nonreqString,

    followerCount: reqNum,
    followingCount: reqNum,
    likeCount: reqNum,
    likedCount: reqNum,

    lastEdit: reqNum,
    lastEditUsername: reqNum,

    pins: [pinnedPostsSchema],
    pronouns: nonreqString,
    statusTitle: nonreqString,

    themeData: themeSchema, // theme id

    totalPosts: reqNum,
    totalReplies: reqNum,
    totalQuotes: reqNum,
    
    privacySetting: privacySettingSchema,
    
    isBrandAccount: reqBool,
    userAge: nonreqNum, //yyyy-mm-dd
    verified: reqBool,
    demo: nonreqBool, 
});

module.exports = mongoose.model('interact-users', interactUserSchema);
