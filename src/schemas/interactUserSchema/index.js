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

// type 06
const privacySettingSchema = mongoose.Schema({
    discoverSetting: reqNum,
    postVisiblityDefault: reqNum,
    postReplyDefault: reqNum,
});

const themeSchema = mongoose.Schema({
    themeID: reqString, // theme id
    testTheme: reqString, // theme id to test
    amountTested: reqNum, // amount of times tested
    testAmount: reqNum, // amount of times to test

    // can add more later
});

// 1: public, 2: friends of friends, 3: private

const interactUserSchema = mongoose.Schema({
    _id: reqString,
    username: reqString,
    lastEditUsername: reqNum,
    displayName: reqString,
    description: reqString,
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
