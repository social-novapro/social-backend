const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactRepliesSchema = require("../../../schemas/postSchemas/interactRepliesSchema");
const interactDeletedSchema = require("../../../schemas/deleted/interactDeletedSchema");
const { v4: uuidv4 } = require("uuid");
const interactPostLikeSchema = require("../../../schemas/postSchemas/interactPostLikeSchema");

async function removePost(postData) {
    if (postData.isReply) await removeFromReplyIndex(postData);
    if (postData.isQuote) await removeQuote(postData);
    
    // if postData.isQuote later
    if (postData.replyIndexID) await deleteReplyIndex(postData);
    await deleteLikes({ postID: postData._id });
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

async function deleteLikes({ postID }) {
    await interactPostLikeSchema.findOneAndDelete({ _id: postID });
}

async function deleteReplyIndex(postData) {
    await interactRepliesSchema.findOneAndDelete({_id: postData.replyIndexID});
};

async function removeQuote({ _id, quoteData }) {
    if (!quoteData) return false;
    const foundPost = await interactPostSchema.findOne({ _id: quoteData.postID })
    if (!foundPost) return false; // was already deleted maybe 
    
    await interactPostSchema.findOneAndUpdate({
        _id: quoteData.postID
    }, {
        totalQuotes: foundPost.totalQuotes ? foundPost.totalQuotes-1 : 0,
    });
}

async function removeFromReplyIndex({_id, replyData}) {
    if (!replyData) return false;
    const foundPost = await interactPostSchema.findOne({ _id: replyData.postID })
    if (!foundPost) return false; // was already deleted maybe

    // removes reply count post
    await interactPostSchema.findOneAndUpdate({
        _id: replyData.postID
    }, {
        totalReplies: foundPost.totalReplies ? foundPost.totalReplies-1 : 0,
    });

    // removes from index
    await interactRepliesSchema.findOneAndUpdate({
        _id: replyData.indexID 
    }, {
        $pull: { "postIDs" : _id },
    });

    return true;
};

async function removeUserLikes({ userID }) {
    const likesData = await interactPostLikeSchema.find({
        "peopleLiked._id" : userID,
    });

    const returnData = []
    for (const like of likesData) {
        returnData.push({ postID: like._id });

        await interactPostLikeSchema.findOneAndUpdate(
            { _id: like._id }, 
            { $pull : { "peopleLiked" : { _id: userID } } },
            { upsert: true }
        );
    }

    return returnData;
}

module.exports = { removePost, removeUserLikes };