const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqBool } = require('../types');

// type 06
const privacySettingSchema = mongoose.Schema({
    discoverSetting: reqNum,
    postVisiblityDefault: reqNum,
    postReplyDefault: reqNum,
});

const postReplySchema = mongoose.Schema({
    // _id: reqString,
    indexID: reqString,
    postID: reqString,
    userID: reqString
});

const postQuoteSchema = mongoose.Schema({
    // _id: reqString,
    indexID: reqString,
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
    
    isQuote: reqBool,
    quoteData: postQuoteSchema,
    quoteIndexID: reqString,

    isReply: reqBool,
    replyData: postReplySchema,
    replyIndexID: reqString, 
    
    deleted: reqBool,

    hasPoll: reqBool,
    pollID: reqString,

    hasMentions: reqBool,
    mentionData: [mentionDataSchema], // max 10 ideally

    quoteReplyPostID: reqString, // legacy
    replyingPostID: reqString, // legacy
    liked: nonreqBool, // this stays null, but is used to check if the user liked the post
    pinned: nonreqBool // this stays null, but is used to check if the user pinned the post
});


module.exports = mongoose.model('interact-post', interactPostSchema);