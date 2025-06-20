const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostLike = require("../../../schemas/postSchemas/interactPostLike");
const interactPostLikeIndex = require("../../../schemas/postSchemas/interactPostLikeIndex");
const { checktime } = require("../../checktime");
const { pushLikeNotifications } = require("../../pushNotifications/postActionNotifications");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require("uuid");
const { getPostWithData } = require("../getPost");

// Check if post is liked by user
async function postIsLiked({ postID, userID }) {
    const postLiked = await interactPostLike.findOne({
        postID: postID,
        userID: userID,
        active: true
    });

    if (postLiked != null) return postLiked;
    else return false;
}

// Get like index for a post or user
// uuid: postID or userID
// type: 0 for post, 1 for user
async function getLikeIndex({ uuid, type, createIfNeed }) {
    // Find Post Schema
    const postLikeIndexFound = await interactPostLikeIndex.findOne({
        uuid,
        type,
        current: true
    });
    if (postLikeIndexFound || postLikeIndexFound.count < 20) {
        return postLikeIndexFound;
    }

    if (!createIfNeed) {
        if (!postLikeIndexFound) return searchErrorV2("D016", { uuid: uuid, type: type });
        return postLikeIndexFound;
    }

    // create a new index
    const newIndexID = uuidv4();
    await interactPostLikeIndex.create({
        _id: newIndexID,
        timestamp: checktime(),
        uuid,
        type,
        nextIndexID: null,
        prevIndexID: postLikeIndexFound ? postLikeIndexFound._id : null,
        current: true,
        count: 0,
        likes: []
    });

    // deactivate previous index
    if (postLikeIndexFound) {
        await interactPostLikeIndex.findOneAndUpdate(
            { _id: postLikeIndexFound._id },
            { current: false, nextIndexID: newIndexID },
            { upsert: true }
        );
    }
}

async function getPostAndUserLikeIndex({ postID, userID, createIfNeed = true }) {
    // Get post like index
    const postLikeIndex = await getLikeIndex({ uuid: postID, type: 0, createIfNeed });
    if (!postLikeIndex) return searchErrorV2("D016", { userID: userID });

    // Get user like index
    const userLikeIndex = await getLikeIndex({ uuid: userID, type: 1, createIfNeed });
    if (!userLikeIndex) return searchErrorV2("D017", { userID: userID });

    return {
        postLikeIndex,
        userLikeIndex
    };
}

// Unlike a post
async function unlikePost({postID, userID}) {
    // Check if post exists
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound || postFound.error) return searchErrorV2("K002", { userID: userID});
    
    const foundLiked = await postIsLiked({ postID, userID });
    if (!foundLiked || postFound.error) return searchErrorV2("D014", { userID: userID });

    // Undo like
    await interactPostLike.findOneAndUpdate(
        { postID: postID, userID: userID }, 
        { active: false },
    );

    // Get indexes
    const postAndUserLikeIndex = await getPostAndUserLikeIndex({ postID, userID, createIfNeed: false });
    if (postAndUserLikeIndex.error) return postAndUserLikeIndex || searchErrorV2("D017", {userID}); // return error if any
    const { postLikeIndex, userLikeIndex } = postAndUserLikeIndex;

    // Remove likeID from post like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: postLikeIndex._id },
        { $pull: { likes: foundLiked._id } },
        { count: postLikeIndex.count>=1 ? postLikeIndex.count-1 : 0 }, 
        { upsert: true }
    );

    // Remove likeID from user like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: userLikeIndex._id },
        { $pull: { likes: foundLiked._id } },
        { count: userLikeIndex.count>=1 ? postLikeIndex.count-1 : 0 }, 
        { upsert: true }
    );
    
    // // Update total likes
    // var newTotalLikes = 0
    // if (!postFound.totalLikes) newTotalLikes = 0 // if no likes, set to 0, shouldnt hit
    // else newTotalLikes = postFound.totalLikes - 1;

    // Update user like count
    const foundUser = await interactUserSchema.findOne({ _id: userID});
    const foundUserLikedCount = foundUser.likedCount ? foundUser.likedCount - 1 : 0;
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { likedCount: foundUserLikedCount }, { upsert: true });

    // Update original poster's like count
    const userFoundOgPost = await interactUserSchema.findOne({ _id: postFound.userID });
    const foundUserLikeCount = userFoundOgPost.likeCount ? userFoundOgPost.likeCount - 1 : 0;
    await interactUserSchema.findOneAndUpdate({ _id: postFound.userID }, { likeCount: foundUserLikeCount }, { upsert: true });

    // if post has coposters, update their like counts
    if (postFound.coposters && postFound.coposters.length > 0) {
        for (const coposter of postFound.coposters) {
            // like on profile
            const coposterFound = await interactUserSchema.findOne({ _id: coposter });
            const foundUserLikeCount = coposterFound.likeCount ? coposterFound.likeCount - 1 : 0;
            await interactUserSchema.findOneAndUpdate({ _id: coposter }, { likeCount: foundUserLikeCount }, { upsert: true });
        }
    }

    // Update post total likes
    // await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
    return postFoundNew;
}

// Like a post
async function likePost({ postID, userID }) {
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound) return searchErrorV2("D015", { userID: userID});

    const foundLiked = await postIsLiked({ postID, userID });
    if (foundLiked) return searchErrorV2("D010", { userID: userID });
    const foundUser = await interactUserSchema.findOne({ _id: userID});

    // Get indexes
    const postAndUserLikeIndex = await getPostAndUserLikeIndex({ postID, userID, createIfNeed: false });
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
        timestamp: checktime()
    });

    // Add likeID to post like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: postLikeIndex._id },
        { $pull: { likes: foundLiked._id } },
        { count: postLikeIndex.count ? postLikeIndex.count+1 : 1 }, 
        { upsert: true }
    );

    // Add likeID to user like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: userLikeIndex._id },
        { $pull: { likes: foundLiked._id } },
        { count: userLikeIndex.count ? postLikeIndex.count+1 : 1 }, 
        { upsert: true }
    );

    // var newTotalLikes = 0
    // if (!postFound.totalLikes) newTotalLikes = 1
    // else newTotalLikes = postFound.totalLikes + 1;
    // await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
   
    // update like counts
    const foundUserLikedCount = foundUser.likedCount ? foundUser.likedCount + 1 : 1;
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { likedCount: foundUserLikedCount }, { upsert: true });

    const userFoundOgPost = await interactUserSchema.findOne({ _id: postFound.userID });
    const foundUserLikeCount = userFoundOgPost.likeCount ? userFoundOgPost.likeCount + 1 : 1;
    await interactUserSchema.findOneAndUpdate({ _id: postFound.userID }, { likeCount: foundUserLikeCount }, { upsert: true });

    // check if had liked previously, and only notify if not
    const postFoundLike = await interactPostLike.find({ postID, userID});
    if (postFoundLike && postFoundLike.length <= 1) pushLikeNotifications({username: foundUser.username, postData: postFoundNew});

    if (postFound.coposters && postFound.coposters.length > 0) {
        for (const coposter of postFound.coposters) {
            // like on profile
            const coposterFound = await interactUserSchema.findOne({ _id: coposter });
            const foundUserLikeCount = coposterFound.likeCount ? coposterFound.likeCount + 1 : 1;
            await interactUserSchema.findOneAndUpdate({ _id: coposter }, { likeCount: foundUserLikeCount }, { upsert: true });
        }
    }

    return postFoundNew;
}

async function getPostLikes({ postID, indexID=null }) {
    var indexFound = null;
    if (indexID) {
        indexFound = await interactPostLikeIndex.findOne({ _id: indexID, uuid: postID, type: 0, current: true });
    } else {
        // Get the latest index for the post
        indexFound = await interactPostLikeIndex.findOne({ uuid: postID, type: 0, current: true }).sort({ timestamp: -1 });
    }
    if (!indexFound) return searchErrorV2("D016", { uuid: postID, type: 0 });
    
    // format the response 
    var returnData = {
        ...indexFound._doc, // include index data
        peopleLiked: []
    };

    const foundLikeData = [];
    for (const likeID of indexFound.likes) {
        const likeData = await interactPostLike.findOne({ _id: likeID, postID: postID, active: true });
        if (likeData) {
            foundLikeData.push(likeData);

            // get user data
            const foundUser = await interactUserSchema.findOne({ _id: likeData.userID });
            if (!foundUser) continue; // skip if user not found
            if (foundUser) {
                returnData.peopleLiked.push({
                    userID: foundUser._id,
                    username: foundUser.username,
                    likeID: likeData._id,
                    timestamp: likeData.timestamp
                });
            }
        }
    }

    returnData.peopleLiked.sort((a, b) => b.timestamp - a.timestamp); // sort by timestamp descending
    return returnData;
}

async function getUserLikes({ userID, indexID=null }) {
    var indexFound = null;
    if (indexID) {
        indexFound = await interactPostLikeIndex.findOne({ _id: indexID, uuid: userID, type: 1, current: true });
    } else {
        // Get the latest index for the post
        indexFound = await interactPostLikeIndex.findOne({ uuid: userID, type: 0, current: true }).sort({ timestamp: -1 });
    }
    if (!indexFound) return searchErrorV2("D016", { uuid: userID, type: 0 });
    
    // format the response 
    var returnData = {
        ...indexFound._doc, // include index data
        peopleLiked: []
    };

    const foundUser = await interactUserSchema.findOne({ _id: likeData.userID });
    if (!foundUser) return searchErrorV2("D018", { userID: userID });

    // get all posts liked by the user
    const foundLikeData = [];
    for (const likeID of indexFound.likes) {
        const likeData = await interactPostLike.findOne({ _id: likeID, userID: userID, active: true });
        if (likeData) {
            foundLikeData.push(likeData);

            // get post data
            const fullPostData = await getPostWithData({ postID: likeData.postID, userID: userID, ownUser: foundUser });
            if (!fullPostData) continue; // skip if post not found
            returnData.postsLiked.push({...fullPostData, likeID: likeData._id, timestamp: likeData.timestamp });
        }
    }

    returnData.peopleLiked.sort((a, b) => b.timestamp - a.timestamp); // sort by timestamp descending
    return returnData;
}

module.exports = {
    postIsLiked,
    likePost,
    unlikePost,
    getPostLikes,
    getPostAndUserLikeIndex,
    getUserLikes,
};
