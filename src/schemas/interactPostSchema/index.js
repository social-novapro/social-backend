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
const interactPostSchemaForQuote = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    timePosted: reqString,
    content: reqString,
    totalLikes: reqNum,
    totalReplies: reqNum,
    edited: reqBool,
    editedTimestamp: reqString,
    editedAmount: reqNum,
    // quoteReplyPostID: reqString,
    // quotedPost: interactPostSchema
});
// type 06
const privacySettingSchema = mongoose.Schema({
    discoverSetting: reqNum,
    postVisiblityDefault: reqNum,
    postReplyDefault: reqNum,
});
const interactUserSchemaForQuote = mongoose.Schema({
    _id: reqString,
    username: reqString,
    lastEditUsername: reqNum,
    displayName: reqString,
    description: reqString,
    pronouns: reqString,
    statusTitle: reqString,
    lastEditDisplayname: reqNum,
    creationTimestamp: reqString,
    followerCount: reqNum,
    followingCount: reqNum,
    likeCount: reqNum,
    likedCount: reqNum,
    totalPosts: reqNum,
    totalReplies: reqNum,
    privacySetting: privacySettingSchema
});

const interactPostSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    timePosted: reqString,
    content: reqString,
    totalLikes: reqNum,
    totalReplies: reqNum,
    edited: reqBool,
    editedTimestamp: reqString,
    editedAmount: reqNum,
    quoteReplyPostID: reqString,
    quotedPost: interactPostSchemaForQuote,
    quotedUser: interactUserSchemaForQuote,
    replyingPostID: reqString
});


module.exports = mongoose.model('interact-post', interactPostSchema);