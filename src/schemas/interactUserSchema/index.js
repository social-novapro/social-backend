const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};
const nonreqBool = {
    type: Boolean,
    required: false
};

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
    lastEditUsername: reqNum,
    displayName: reqString,
    description: reqString,
    pins: [pinnedPostsSchema],
    pronouns: reqString,
    statusTitle: reqString,
    themeData: themeSchema, // theme id
    lastEdit: reqNum,
    creationTimestamp: reqString,
    followerCount: reqNum,
    followingCount: reqNum,
    likeCount: reqNum,
    likedCount: reqNum,
    totalPosts: reqNum,
    totalReplies: reqNum,
    isBrandAccount: reqBool,
    privacySetting: privacySettingSchema,
    profileURL: reqString,
    userAge: reqNum, //yyyy-mm-dd
    verified: reqBool,
    demo: nonreqBool, 
});

module.exports = mongoose.model('interact-users', interactUserSchema);
