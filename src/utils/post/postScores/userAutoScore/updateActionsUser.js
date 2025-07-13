const { adjustWeight } = require(".");
const interactCategoryUser = require("../../../../schemas/categories/interactCategoryUser");
const interactPostSchema = require("../../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../../schemas/interactUserSchema");
const interactPostLike = require("../../../../schemas/postSchemas/interactPostLike");
const { checktime } = require("../../../checktime");

async function actionUpdateUserAutoScore() {
    // IF I REUSE THIS FUNCTION, I NEED TO REMOVE OLD WEIGHT ADJUSTMENTS FIRST

    // get all users
    const allUsers = await interactUserSchema.find();
    console.log(`Updating user auto scores for ${allUsers.length} users...`);
    for (const user of allUsers) {
        const userID = user._id;

        // get all likes of user
        const userLikes = await interactPostLike.find({ userID, active: true });
        console.log(`User ${userID} has ${userLikes.length} likes.`);
        if (userLikes && userLikes.length > 0) {
            for (const like of userLikes) {
                const postID = like.postID;
                const foundPost = await interactPostSchema.findOne({ _id: postID });
                if (!foundPost) continue; // skip if post not found

                if (!foundPost.category) continue; // skip if post has no category
                // Adjust weights based on the action
                await adjustWeight({ userID, action: "POST.LIKE", postID, postData: foundPost });
            }
        }

        // Get all posts of user (and reply/quotes)
        const userPosts = await interactPostSchema.find({ userID });
        console.log(`User ${userID} has ${userPosts.length} posts.`);
        if (userPosts && userPosts.length > 0) {
            for (const post of userPosts) {
                const postID = post._id;

                // Adjust weight for post creation
                if (post.category) await adjustWeight({ userID, action: "POST.CREATED", postID, postData: post });
                
                // is post a reply or quote
                if (post.isReply && post.replyData && post.replyData.postID) {
                    // get post
                    const repliedPostID = post.replyData.postID;
                    const repliedPost = await interactPostSchema.findOne({ _id: repliedPostID });
                    if (repliedPost && repliedPost.category) {
                        // Adjust weight for reply
                        await adjustWeight({ userID, action: "POST.REPLY_CREATED", postID, postData: repliedPost });
                    }
                } else if (post.isReply) {
                    console.log(`Post ${postID} is a reply but has no replyData, skipping...`);
                }

                if (post.isQuote && post.quoteData && post.quoteData.postID) {
                    // get post
                    const quotedPostID = post.quoteData.postID;
                    const quotedPost = await interactPostSchema.findOne({ _id: quotedPostID });
                    if (quotedPost && quotedPost.category) {
                        // Adjust weight for quote
                        await adjustWeight({ userID, action: "POST.QUOTE_CREATED", postID, postData: quotedPost });
                    }
                } else if (post.isQuote) {
                    console.log(`Post ${postID} is a quote but has no quoteData, skipping...`);
                }
            }
        }

        // Add more adjustment logic as needed
    }

    return { done: true, message: "User auto scores updated." };
}

async function actionUndoUserAutoScore() {
    // get all user category scores
    const allUserCategoryScores = await interactCategoryUser.find();
    for (const userCategoryScore of allUserCategoryScores) {
        // remove amountLikes, posts replies quotes and autoscore

        await interactCategoryUser.findOneAndUpdate(
            { _id: userCategoryScore._id },
            {
                $set: {
                    amountLikes: 0,
                    amountPosts: 0,
                    amountReplies: 0,
                    amountQuotes: 0,
                    autoScore: 0,
                    timestamp: checktime()
                }
            }
        );
    }
    
    return { done: true, message: "User auto scores undone." };
}

module.exports = {
    actionUpdateUserAutoScore,
    actionUndoUserAutoScore
};