const { getPostAndUserLikeIndex } = require(".");
const interactPostLike = require("../../../schemas/postSchemas/interactPostLike");
const interactPostLikeIndex = require("../../../schemas/postSchemas/interactPostLikeIndex");
const interactPostLikeSchema = require("../../../schemas/postSchemas/interactPostLikeSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require("uuid");

// update admin action 
async function actionUpdateLikePostsIndexes() {
    const allPosts = await interactPostLikeSchema.find();
    for (const post of allPosts) {
        await convertOldPostLikeSchema({ postID: post._id });
    }

    return { done: true, message: "Converted old post like schema to new one." };
}

// Convert old post like schema to new one
async function convertOldPostLikeSchema({ postID }) {
    const oldPostLikes = await interactPostLikeSchema.findOne({ _id: postID });
    if (!oldPostLikes) return searchErrorV2("D033", { postID: postID });

    for (const like of oldPostLikes.peopleLiked) {
        const userID = like._id;
        // Get indexes
        const postAndUserLikeIndex = await getPostAndUserLikeIndex({ postID, userID, createIfNeed: true });
        if (postAndUserLikeIndex.error) return postAndUserLikeIndex || searchErrorV2("D017", {userID}); // return error if any
        const { postLikeIndex, userLikeIndex } = postAndUserLikeIndex;

        const likeID = uuidv4();
        // create a new like entry
        await interactPostLike.create({
            _id: likeID,
            postID: postID,
            userID: userID,
            userIndexID: userLikeIndex._id,
            postIndexID: postLikeIndex._id,
            active: true,
            timestamp: like.timeStamp || checktime(),
        });

        // Add likeID to post like index
        await interactPostLikeIndex.findOneAndUpdate(
            { _id: postLikeIndex._id },
            { 
                $push: { likes: likeID },
                $set: { count: postLikeIndex.count ? postLikeIndex.count + 1 : 1 }
            },
            { upsert: true }
        );

        // Add likeID to user like index
        await interactPostLikeIndex.findOneAndUpdate(
            { _id: userLikeIndex._id },
            { 
                $push: { likes: likeID },
                $set: { count: userLikeIndex.count ? userLikeIndex.count + 1 : 1 }
            },
            { upsert: true }
        );
    }

    return { done: true, message: "Converted old post like schema to new one." };
}

async function actionUndoLikePostsIndexes() {
    // just delete all interactPostLike and interactPostLikeIndex data
    await interactPostLike.deleteMany({});
    await interactPostLikeIndex.deleteMany({});
    return { done: true, message: "Undone like posts indexes." };
}

module.exports = {
    actionUpdateLikePostsIndexes,
    convertOldPostLikeSchema,
    actionUndoLikePostsIndexes
};