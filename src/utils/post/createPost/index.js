const {v4 : uuidv4} = require('uuid');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const { SCHEMA_VERSIONS } = require('../../../../config.json');
const { checktime } = require('../../checktime');
const interactUserSchema = require('../../../schemas/interactUserSchema');

async function newPostID() {
    const newID = uuidv4();
    return doubleCheckNewID(newID);
};

async function doubleCheckNewID(newID) {
    result = await interactPostSchema.findOne({ _id: newID });
    if (result) return newPostID();
    else return newID;
};

async function newPostIndex(userID, content, quoteReplyPostID) {
    const postID = await newPostID();
    const currentTime = checktime();

    const quotingPost = await interactPostSchema.findOne({_id: quoteReplyPostID});

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
    if (quotingPost) {
        const quotingUser = await interactUserSchema.findOne({_id: quotingPost.userID})

        await interactPostSchema.findOneAndUpdate({
            _id: postID
        }, {
            quoteReplyPostID: `${quotingPost ? quotingPost._id : null}`,
            quotedPost: quotingPost,
            quotedUser: quotingUser
        }, {
            upsert: true
        })
    }
    
    return postID;
};

module.exports = { newPostIndex };