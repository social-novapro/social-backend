const interactAdminRequestSchema = require("../../../../schemas/admin/interactAdminRequestSchema");
const interactUserAnalyticSchema = require("../../../../schemas/analytics/interactUserAnalyticSchema");
const developerAppToken = require("../../../../schemas/developer/developerAppToken");
const developerToken = require("../../../../schemas/developer/developerToken");
const interactPostSchema = require("../../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../../schemas/interactUserSchema");
const interactPostLikeSchema = require("../../../../schemas/postSchemas/interactPostLikeSchema");
const { addQuoteToIndex, addReplyToIndex } = require("../../../post/createPost");

async function updateAllUserCounts() {
    const users = await interactUserSchema.find();
    for (const user of users) {
        user.followerCount = 0;
        user.followingCount = 0;
        
        const userPosts = await interactPostSchema.find({ userID: user._id });
        var totalLikes = 0;
        for (const post of userPosts) {
            totalLikes += post.totalLikes;
        }

        const userLikes = await interactPostLikeSchema.find({ "peopleLiked._id": user._id });
        user.likeCount = totalLikes;
        user.likedCount = userLikes.length;

        user.totalPosts = userPosts.length;
        user.totalReplies = userPosts.filter(post => post.isReply).length;
        user.totalQuotes = userPosts.filter(post => post.isQuote).length;

        await interactUserSchema.findOneAndUpdate({ _id: user._id }, user);
    }
}

async function updateAllTimestamps() {
    return { done: true };

    // interactPostLikeSchema
    const postLikes = await interactPostLikeSchema.find();
    for (const post of postLikes) {
        if (!post.peopleLiked) post.peopleLiked = [];
        for (const like of post.peopleLiked) {
            like.timestamp = convertStringToNumber(like.timestamp);
        }
        await interactPostLikeSchema.findOneAndUpdate({ _id: post._id }, post);
    }

    // interactUserSchema
    const users = await interactUserSchema.find();
    for (const user of users) {
        if (user.creationTimestamp) user.creationTimestamp = convertStringToNumber(user.creationTimestamp);
        else user.creationTimestamp = 0;

        if (!user.username) user.username = user._id;
        if (!user.usernameLc) user.usernameLc = user.username.toLowerCase();
        if (!user.displayName) user.displayName = user.username;

        if (!user.description) user.description = "This user has no description.";
        if (!user.lastEdit) user.lastEdit = user.creationTimestamp;
        if (!user.lastEditUsername) user.lastEditUsername = user.creationTimestamp;

        if (!user.followerCount) user.followerCount = 0;
        if (!user.followingCount) user.followingCount = 0;
        if (!user.likeCount) user.likeCount = 0;
        if (!user.likedCount) user.likedCount = 0;

        //if
        if (!user.isBrandAccount) user.isBrandAccount = false;
        if (!user.verified) user.verified = false;        

        if (!user.totalPosts) user.totalPosts = 0;
        if (!user.totalReplies) user.totalReplies = 0;
        if (!user.totalQuotes) user.totalQuotes = 0;

        await interactUserSchema.findOneAndUpdate({ _id: user._id }, user);
    }


    // interactPostSchema
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        post.timestamp = convertStringToNumber(post.timePosted);
        // userID manage
        if (!post.postID && post.authorID) {
            post.userID = post.authorID;
            post.authorID = null;
        }

        // required manage 
        if (!post.hasPoll) post.hasPoll = false;
        if (!post.isQuote) post.isQuote = false;
        if (!post.isReply) post.isReply = false;
        if (!post.edited) post.edited = false;
        if (!post.totalLikes) post.totalLikes = 0;
        if (!post.totalReplies) post.totalReplies = 0;
        if (!post.totalQuotes) post.totalQuotes = 0;
        if (!post.content) post.content = "This post previously had no content.";
        
        // reply manage
        if (post.replyingPostID && !post.replyData) {
            post.isReply = true;

            const replyPost = await interactPostSchema.findOne({ _id: post.replyingPostID });
            const replyIndexID = await addReplyToIndex(replyPost, post._id);
            
            post.replyData = {
                indexID: replyIndexID,
                postID: replyPost._id,
                userID: replyPost.userID
            }
            post.replyingPostID = null;
        }

        // quote manage
        if (post.quoteReplyPostID && !post.quoteData) {
            post.isQuote = true;

            const quotePost = await interactPostSchema.findOne({ _id: post.quoteReplyPostID });
            const quoteIndexID = await addQuoteToIndex(quotePost, post._id);
            
            post.quoteData = {
                indexID: quoteIndexID,
                postID: quotePost._id,
                userID: quotePost.userID
            }
            post.quoteReplyPostID = null;
            post.quotedPost = false;
            post.quotedUser = false;
        }

        await interactPostSchema.findOneAndUpdate({ _id: post._id }, post);
    }
    
    await updateAllUserCounts();

    // developerToken
    const devToken = await developerToken.find();
    for (const token of devToken) {
        if (!token.creationTimestamp) continue;
        token.creationTimestamp = convertStringToNumber(token.creationTimestamp);
        await developerToken.findOneAndUpdate({ _id: token._id }, { creationTimestamp: token.creationTimestamp });
    }
    
    // developerAppToken
    const devApps = await developerAppToken.find();
    for (const app of devApps) {
        if (!app.devToken) {
            await developerAppToken.findOneAndDelete({ _id: app._id });
            continue;
        }
        if (!app.creationTimestamp) continue;
        app.creationTimestamp = convertStringToNumber(app.creationTimestamp);
        await developerAppToken.findOneAndUpdate({ _id: app._id }, { creationTimestamp: app.creationTimestamp });
    }
    
    // interactAdminRequestSchema
    const adminRequestSchema = await interactAdminRequestSchema.find()
    for (const request of adminRequestSchema) {
        request.timestamp = convertStringToNumber(request.timestamp);
        request.acceptedTimestamp = convertStringToNumber(request.acceptedTimestamp);
        await request.save();
    }

    // interactUserAnalyticSchema
    const userAnalyticSchema = await interactUserAnalyticSchema.find()
    for (const user of userAnalyticSchema) {
        for (var i = 0; i < user.userConnections.length; i++) {
            const connection = user.userConnections[i];
            if (!connection.timestamp) connection.timestamp = checktime();
            else connection.timestamp = convertStringToNumber(connection.timestamp);
            if (!connection.api_urlbase) connection.api_urlbase = "https://interact.novapro.net/";
            if (!connection.api_url) connection.api_url = "https://interact.novapro.net/";
        }
       
        await interactUserAnalyticSchema.findOneAndUpdate({ _id: user._id }, { userConnections: user.userConnections });
    }
}

async function undoAllTimestamps() {
    return { done: true };

    // interactPostSchema
    // cant undo this one

    // developerToken
    const devToken = await developerToken.find();
    for (const token of devToken) {
        if (!token.creationTimestamp) continue;
        token.creationTimestamp = convertNumberToString(token.creationTimestamp);
        await developerToken.findOneAndUpdate({ _id: token._id }, { creationTimestamp: token.creationTimestamp });
    }

    // developerAppToken
    const devApps = await developerAppToken.find();
    for (const app of devApps) {
        if (!app.devToken) {
            await developerAppToken.findOneAndDelete({ _id: app._id });
            continue;
        }

        if (!app.creationTimestamp) continue;
        app.creationTimestamp = convertNumberToString(app.creationTimestamp);
        await developerAppToken.findOneAndUpdate({ _id: app._id }, { creationTimestamp: app.creationTimestamp });
    }

    // interactAdminRequestSchema
    const adminRequestSchema = await interactAdminRequestSchema.find()
    for (const request of adminRequestSchema) {
        request.timestamp = convertNumberToString(request.timestamp);
        request.acceptedTimestamp = convertNumberToString(request.acceptedTimestamp);
        await request.save();
    }

    // interactUserAnalyticSchema
    const userAnalyticSchema = await interactUserAnalyticSchema.find()
    for (const user of userAnalyticSchema) {
        for (const connection of user.userConnections) {
            if (!connection.timestamp) connection.timestamp = convertNumberToString(checktime());
            else connection.timestamp = convertNumberToString(connection.timestamp);
            if (!connection.api_urlbase) connection.api_urlbase = "https://interact.novapro.net/";
            if (!connection.api_url) connection.api_url = "https://interact.novapro.net/";
        }

        await interactUserAnalyticSchema.findOneAndUpdate({ _id: user._id }, { userConnections: user.userConnections });
    }
}

function convertStringToNumber(timestamp) {
    return Number(timestamp);
}
function convertNumberToString(timestamp) {
    return String(timestamp);
}

module.exports = { 
    updateAllTimestamps,
    undoAllTimestamps,
}
