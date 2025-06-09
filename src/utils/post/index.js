const interactPostSchema = require("../../schemas/interactPostSchema");
const interactPostEditSchema = require("../../schemas/postSchemas/interactPostEditSchema");
const interactRepliesSchema = require("../../schemas/postSchemas/interactRepliesSchema");
const interactQuotesSchema = require("../../schemas/postSchemas/interactQuotesSchema");
const { checkPostContent } = require("../checks");
const { checktime } = require("../checktime");
const { searchErrorV2 } = require("../searchError");
const { embedEditedPost } = require("../search/embed");
const { editTags } = require("./tags");
const { getPostWithData } = require("./getPost");
const interactUserSchema = require("../../schemas/interactUserSchema");
const { editAttachments } = require("./attachments");
const { categorizeEditedPost } = require("./categories");

async function getPostReplies({ postID, userID }) {
    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return searchErrorV2("D001", { userID });
    else if (!postData.replyIndexID) return searchErrorV2("D012", { userID });

    const replyIndex = await interactRepliesSchema.findOne({ _id: postData.replyIndexID });
    if (!replyIndex || !replyIndex.postIDs || !replyIndex.postIDs[0]) return searchErrorV2("D013", { userID });
    const dataArr = [];
    for (const reply of replyIndex.postIDs) {
        const replyData = await interactPostSchema.findOne({_id: reply});
        dataArr.push(replyData);
    }

    const dataSend = {
        'post': postData,
        'replyIndex': replyIndex,
        'replies': dataArr
    }
    
    return dataSend;
}

async function getPostQuotes({ postID, userID }) {
    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return searchErrorV2("D001", { userID });
    else if (!postData.quoteIndexID) return searchErrorV2("D016", { userID });

    const quoteIndex = await interactQuotesSchema.findOne({ _id: postData.quoteIndexID });
    if (!quoteIndex || !quoteIndex.postIDs || !quoteIndex.postIDs[0]) return searchErrorV2("D017", { userID });
    
    const dataArr = [];
    for (const quote of quoteIndex.postIDs) {
        const replyData = await interactPostSchema.findOne({_id: quote});
        dataArr.push(replyData);
    }

    const dataSend = {
        'post': postData,
        'quoteIndex': quoteIndex,
        'quotes': dataArr
    }
    
    return dataSend;
}

async function getPostEdits({ postID, userID }) {
    const PostData = await interactPostEditSchema.findOne({_id: postID});
    if (!PostData || !PostData.edits || !PostData.edits[0]) return searchErrorV2("D004", { userID });
    else return PostData;
}

async function editPost({ postID, userID, content}) {
    if (!content && !postID) return searchErrorV2("E001", { userID });
    else if (!content) return searchErrorV2("E002", { userID });
    else if (!postID) return searchErrorV2("E010", { userID });
    else if (content.length > 512) return searchErrorV2("E005", { userID })

    const checkedContent = await checkPostContent(content);
    if (!checkedContent || checkedContent.error) return checkedContent;

    const postCheck = await interactPostSchema.findOne({ _id: postID});
    if (!postCheck) return searchErrorV2("K002", { userID });
    else if (postCheck.userID != userID) return searchErrorV2("D008", { userID });
    else if (postCheck.content == content) return searchErrorV2("D009", { userID });

    // check for attachments
    // re-add attachments
    const addedAttachments = await editAttachments({ postID, content });


    const editedTimestamp = checktime();
    var editedAmount;
    if (postCheck.editedAmount == null) editedAmount = 0;
    else editedAmount = postCheck.editedAmount + 1;
    
    await interactPostSchema.findOneAndUpdate(
        { _id: postID }, 
        { content: addedAttachments.newContent, attachments: addedAttachments.attachments, edited: true, editedTimestamp, editedAmount },
        { upsert: true }
    );

    await interactPostEditSchema.findOneAndUpdate( 
        { _id: postID },
        { $push : { "edits" : { 
            publicTimestamp: postCheck.editedAmount == 0 ? postCheck.timestamp : postCheck.editedTimestamp,
            removeTimestamp: editedTimestamp,
            content: postCheck.content
        }}},
        { upsert: true }
    )

    // re-embeds post
    embedEditedPost({ postID, userID, timestamp: postCheck.timestamp, content }).then((embedResult) => {
        if (embedResult.error) return console.error("Error embedding edited post:", embedResult);
        // re-categorizes post
        categorizeEditedPost({ postID, userID });
    });
    
    // re-tags post
    editTags({ userID, postID, newContent: content, postedTimestamp: postCheck.timestamp });

    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return searchErrorV2("D002", { userID });
    return { "before": postCheck, "new": postData }
}

async function getPostRepliesFull({ postID, userID }) {
    const foundReplies = await getPostReplies({ postID, userID });
    if (!foundReplies || foundReplies.error) return foundReplies;

    const ownUser = await interactUserSchema.findOne({_id: userID});
    const fullReplies = [];
    for (const reply of foundReplies.replies) {
        const postData = await getPostWithData({userID: userID, postID: reply._id, post: reply, ownUser});
        fullReplies.push(postData);
    }
    
    const dataSend = {
        'post': foundReplies.postData,
        'replyIndex': foundReplies.replyIndex,
        'replies': fullReplies
    }
    
    return dataSend;
}

async function getPostQuotesFull({ postID, userID }) {
    const foundQuotes = await getPostQuotes({ postID, userID });
    if (!foundQuotes || foundQuotes.error) return foundQuotes;

    const ownUser = await interactUserSchema.findOne({_id: userID});
    const fullQuotes = [];
    for (const quote of foundQuotes.quotes) {
        const postData = await getPostWithData({userID: userID, postID: quote._id, post: quote, ownUser});
        fullQuotes.push(postData);
    }

    const dataSend = {
        'post': foundQuotes.postData,
        'quoteIndex': foundQuotes.quoteIndex,
        'quotes': fullQuotes
    }
    
    return dataSend;
}

module.exports = { 
    getPostReplies,
    getPostQuotes,
    getPostEdits,
    editPost,
    getPostRepliesFull,
    getPostQuotesFull
};
