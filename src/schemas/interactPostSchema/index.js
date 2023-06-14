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

const postReplySchema = mongoose.Schema({
    // _id: reqString,
    indexID: reqString,
    postID: reqString,
    userID: reqString
});

const postQuoteSchema = mongoose.Schema({
    // _id: reqString,
    postID: reqString,
    userID: reqString
});

const mentionDataSchema = mongoose.Schema({
    // _id: reqString,
    userID: reqString,
    username: reqString,
    index: reqNum
});

const interactPostSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    timePosted: reqString,
    content: reqString,
    totalLikes: reqNum,
    totalReplies: reqNum,
    totalQuotes: reqNum,

    privacySetting: privacySettingSchema,
    edited: reqBool,
    editedTimestamp: reqString,
    editedAmount: reqNum,
    
    quoteReplyPostID: reqString, // legacy
    quotedPost: interactPostSchemaForQuote, // legacy
    quotedUser: interactUserSchemaForQuote, // legacy

    isQuote: reqBool,
    quoteData: postQuoteSchema, // will remove

    isReply: reqBool,
    replyData: postReplySchema, // will remove
    replyIndexID: reqString, 
    
    deleted: reqBool,

    hasPoll: reqBool,
    pollID: reqString,

    hasMentions: reqBool,
    mentionData: [mentionDataSchema], // max 10 ideally

    replyingPostID: reqString, // legacy
    liked: nonreqBool // this stays null, but is used to check if the user liked the post
});


module.exports = mongoose.model('interact-post', interactPostSchema);