const {v4 : uuidv4} = require('uuid');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const { SCHEMA_VERSIONS } = require('../../../../config.json');
const { checktime } = require('../../checktime');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const {pushQuotePost} = require('../../../utils/notifications/pustQuotePost');

async function newPostID() {
    const newID = uuidv4();
    return doubleCheckNewID(newID);
};

async function doubleCheckNewID(newID) {
    result = await interactPostSchema.findOne({ _id: newID });
    if (result) return newPostID();
    else return newID;
};

async function newPostIndex(userID, data) {
    const { content, quoteReplyPostID, replyingPostID } = data
    const postID = await newPostID();
    const currentTime = checktime();


    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {        
        _id: postID,
        __v: SCHEMA_VERSIONS.interactPostSchema,
        timePosted: currentTime,
        userID,
        content,
        totalLikes: 0,
        totalReplies: 0
    }, {
        upsert: true
    });

    if (quoteReplyPostID) {
        const quotingPost = await interactPostSchema.findOne({_id: quoteReplyPostID});
        if (quotingPost) return quotingPostSetup(quotingPost, postID, userID);
    }
    if (replyingPostID) {
        const replyingPost = await interactPostSchema.findOne({_id: replyingPostID});
        if (replyingPost) await replyingPostSetup(replyingPost, postID, userID);
    }
    
    return postID;
};

async function quotingPostSetup(quotingPost, postID, userID) {
    // console.log(quotingPost)
    const quotingUser = await interactUserSchema.findOne({_id: quotingPost.userID})
    
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        quoteReplyPostID: `${quotingPost ? quotingPost._id : null}`,
        quotedPost: quotingPost,
        quotedUser: quotingUser
    }, {
        upsert: true
    });

    await pushQuotePost(userID, postID, quotingUser._id);

    return postID;
}

async function replyingPostSetup(replyingPost, postID, userID) {
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        replyingPostID: replyingPost._id,
    }, {
        upsert: true
    })
    return postID;
}

module.exports = { newPostIndex };