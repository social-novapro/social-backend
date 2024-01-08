const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqBool, nonreqString, nonreqNum } = require('../types');

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
    userID: nonreqString,
    username: nonreqString,
    index: nonreqNum
});

const interactPostSchema = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    indexID: nonreqString,
    coposters: [nonreqString], // only populate when approved
    timestamp: reqNum,
    content: reqString,
    totalLikes: reqNum,
    totalReplies: reqNum,
    totalQuotes: reqNum,

    privacyOverride: nonreqNum,
    /*
    0 = none
    */

    edited: reqBool,
    editedTimestamp: nonreqString,
    editedAmount: nonreqNum,
    
    isQuote: reqBool,
    quoteData: postQuoteSchema,
    quoteIndexID: nonreqString,

    isReply: nonreqBool,
    replyData: postReplySchema,
    replyIndexID: nonreqString, 
    
    deleted: nonreqBool,

    hasPoll: reqBool,
    pollID: nonreqString,

    hasMentions: nonreqBool,
    mentionData: [ mentionDataSchema ],

    // legacy data
    authorID: nonreqString, // legacy
    timePosted: nonreqString, // legacy
    quoteReplyPostID: nonreqString, // legacy
    replyingPostID: nonreqString, // legacy
    quotedPost: nonreqBool, // legacy
    quotedUser: nonreqBool, // legacy

    liked: nonreqBool, // this stays null, but is used to check if the user liked the post
    pinned: nonreqBool // this stays null, but is used to check if the user pinned the post
});


module.exports = mongoose.model('interact-post', interactPostSchema);