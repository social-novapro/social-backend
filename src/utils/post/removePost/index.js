const { v4: uuidv4 } = require("uuid");
const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactRepliesSchema = require("../../../schemas/postSchemas/interactRepliesSchema");
const interactPostLikeSchema = require("../../../schemas/postSchemas/interactPostLikeSchema");
const interactQuotesSchema = require("../../../schemas/postSchemas/interactQuotesSchema");
const interactDeletedSchema = require("../../../schemas/deleted/interactDeletedSchema");
const { deletePostNotifications } = require("../../notifications/deleteRemovedPost");
const { pullPostBookmarks } = require("../../bookmarks");
const { removePostFromIndex } = require("../postIndexManagement");
const { deleteEmbedPost } = require("../../search/embed");
const { removeTags } = require("../tags");
const { removePostFromUserPostIndex } = require("../userPostIndexManagement");
const { adjustWeight } = require("../postScores/userAutoScore");

async function removePost(postData) {
    if (postData.isReply) await removeFromReplyIndex(postData);
    if (postData.isQuote) await removeFromQuoteIndex(postData);
    
    // if postData.isQuote later
    if (postData.replyIndexID) await deleteReplyIndex(postData);

    await deleteLikes({ postID: postData._id });
    await removePostFromIndex({ userID: postData.userID, postID: postData._id });
    await removePostFromUserPostIndex({ userID: postData.userID, postID: postData._id, userPostIndexID: postData.userPostIndexID });

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

    // removes previously pushed notifications
    await deletePostNotifications({ postID: postData._id });

    // pulls previously saved bookmarks
    await pullPostBookmarks({ postID: postData._id, userID: postData.userID });

    // pulls embedding
    deleteEmbedPost({ postID: postData._id });

    // pulls tags
    removeTags({ userID: postData.userID, postID: postData._id });
    
    // adjust weight
    adjustWeight({ userID: postData.userID, action: "POST.DELETED", postID: postData._id, postData });

    return true;
};

async function deleteLikes({ postID }) {
    await interactPostLikeSchema.findOneAndDelete({ _id: postID });
}

async function deleteReplyIndex(postData) {
    await interactRepliesSchema.findOneAndDelete({_id: postData.replyIndexID});
};

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

    adjustWeight({ userID: replyData.userID, action: "POST.REPLY_DELETED", postID: replyData.postID, postData: foundPost });
    return true;
};

async function removeFromQuoteIndex({_id, quoteData}) {
    if (!quoteData) return false;
    const foundPost = await interactPostSchema.findOne({ _id: quoteData.postID })
    if (!foundPost) return false; // was already deleted maybe

    // removes reply count post
    await interactPostSchema.findOneAndUpdate({
        _id: quoteData.postID
    }, {
        totalQuotes: foundPost.totalQuotes ? foundPost.totalQuotes-1 : 0,
    });

    // removes from index
    await interactQuotesSchema.findOneAndUpdate({
        _id: quoteData.indexID 
    }, {
        $pull: { "postIDs" : _id },
    });

    adjustWeight({ userID: quoteData.userID, action: "POST.QUOTE_DELETED", postID: quoteData.postID, postData: foundPost });
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