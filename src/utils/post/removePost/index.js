const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactRepliesSchema = require("../../../schemas/postSchemas/interactRepliesSchema");
const interactDeletedSchema = require("../../../schemas/interactDeletedSchema");
const { v4: uuidv4 } = require("uuid");

async function removePost(postData) {
    if (postData.isReply) await removeFromReplyIndex(postData);
    
    // if postData.isQuote later
    if (postData.replyIndexID) await deleteReplyIndex(postData);
    await interactPostSchema.findOneAndDelete({_id: postData._id});
    await interactPostSchema.findOneAndUpdate({
        _id: postData.postID
    }, {
        deleted: true,
    }, {
        upsert: true
    });
    
    await interactDeletedSchema.create({ 
        _id: uuidv4(),
        type: 2,
        userID: postData.userID
    })
    
    return true;
};

async function deleteReplyIndex(postData) {
    await interactRepliesSchema.findOneAndDelete({_id: postData.replyIndexID});
};

async function removeFromReplyIndex({_id, replyData}) {
    if (!replyData) return false;
    
    // removes reply count post
    await interactPostSchema.findOneAndUpdate({
        _id: replyData.postID
    }, {
        totalReplies: replyData.totalReplies ? replyData.totalReplies-- : 0,
    });

    // removes from index
    await interactRepliesSchema.findOneAndUpdate({
        _id: replyData.indexID 
    }, {
        $pull: { "postIDs" : _id },
    });

    return true;
};


module.exports = { removePost };