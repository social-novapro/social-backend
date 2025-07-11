const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostLike = require("../../../schemas/postSchemas/interactPostLike");
const interactPostLikeIndex = require("../../../schemas/postSchemas/interactPostLikeIndex");
const { checktime } = require("../../checktime");
const { pushLikeNotifications } = require("../../pushNotifications/postActionNotifications");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require("uuid");
const { getPostWithData } = require("../getPost");
const { postIsLiked } = require("./isPostLiked");
const { checkUserRelationForPrivacy } = require("../../user/relations");
const { adjustWeight } = require("../postScores/userAutoScore");

// Get like index for a post or user
// uuid: postID or userID
// type: 0 for post, 1 for user
async function getLikeIndex({ uuid, type, indexID=null, createIfNeed }) {
    // Find Post Schema
    var postLikeIndexFound = null;
    if (indexID) {
        postLikeIndexFound = await interactPostLikeIndex.findOne({
            _id: indexID,
            uuid: uuid,
            type: type,
        });
    } else {
        postLikeIndexFound = await interactPostLikeIndex.findOne({
            uuid,
            type,
            current: true
        });
    }

    if (postLikeIndexFound && postLikeIndexFound.likes.length < 20) {
        return postLikeIndexFound;
    }

    if (!createIfNeed) {
        if (!postLikeIndexFound) return searchErrorV2("D027", { uuid: uuid, type: type });
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

    // return the new index
    const newIndex = await interactPostLikeIndex.findOne({ _id: newIndexID });
    if (!newIndex) return searchErrorV2("D028", { uuid: uuid, type: type });
    return newIndex;
}

async function getPostAndUserLikeIndex({ postID, userID, postIndexID=null, userIndexID=null, createIfNeed = true }) {
    // Get post like index
    const postLikeIndex = await getLikeIndex({ uuid: postID, type: 0, indexID: postIndexID, createIfNeed });
    if (!postLikeIndex) return searchErrorV2("D028", { userID: userID });

    // Get user like index
    const userLikeIndex = await getLikeIndex({ uuid: userID, type: 1, indexID: userIndexID, createIfNeed });
    if (!userLikeIndex) return searchErrorV2("D029", { userID: userID });

    return {
        postLikeIndex,
        userLikeIndex
    };
}

// Unlike a post
async function unlikePost({postID, userID}) {
    // Check if post exists
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound || postFound.error) return searchErrorV2("D030", { userID: userID});
    
    const foundLiked = await postIsLiked({ postID, userID });
    if (!foundLiked || postFound.error) return searchErrorV2("D031", { userID: userID });

    // Undo like
    await interactPostLike.findOneAndUpdate(
        { _id: foundLiked._id },
        // { postID: postID, userID: userID, active: true }, 
        { active: false },
        { upsert: true }
    );

    // get index holding the like
    // Get indexes
    const postAndUserLikeIndex = await getPostAndUserLikeIndex({ postID, userID, postIndexID: foundLiked.postIndexID, userIndexID: foundLiked.userIndexID, createIfNeed: false });
    // if theres an error i should probably inactive the like , wait no i do undo it 
    if (postAndUserLikeIndex.error) return postAndUserLikeIndex || searchErrorV2("D027", {userID}); // return error if any
    const { postLikeIndex, userLikeIndex } = postAndUserLikeIndex;

    // Remove likeID from post like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: postLikeIndex._id },
        { 
            $pull: { likes: foundLiked._id } ,
            $set: { count: postLikeIndex.count>=1 ? postLikeIndex.count-1 : 0 }
        }, 
        { upsert: true }
    );

    // console.log("postLikeIndex", postLikeIndex, foundLiked);
    // console.log("userLikeIndex", userLikeIndex, foundLiked);

    // Remove likeID from user like index
    await interactPostLikeIndex.findOneAndUpdate(
        { _id: userLikeIndex._id },
        { 
            $pull: { likes: foundLiked._id },
            $set: { count: userLikeIndex.count>=1 ? userLikeIndex.count-1 : 0 }
        },
        { upsert: true }
    );
    
    // Update total likes
    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 0 // if no likes, set to 0, shouldnt hit
    else newTotalLikes = postFound.totalLikes - 1;

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });

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
    const postAndUserLikeIndex = await getPostAndUserLikeIndex({ postID, userID, createIfNeed: true });
    if (postAndUserLikeIndex.error) return postAndUserLikeIndex || searchErrorV2("D027", {userID}); // return error if any
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

    // update like counts
    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes + 1;

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
   
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});

    // Update like count for user liking
    const foundUserLikedCount = foundUser.likedCount ? foundUser.likedCount + 1 : 1;
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { likedCount: foundUserLikedCount }, { upsert: true });

    // Update original poster's like count
    const userFoundOgPost = await interactUserSchema.findOne({ _id: postFound.userID });
    const foundUserLikeCount = userFoundOgPost.likeCount ? userFoundOgPost.likeCount + 1 : 1;
    await interactUserSchema.findOneAndUpdate({ _id: postFound.userID }, { likeCount: foundUserLikeCount }, { upsert: true });

    // update coposters' like counts
    if (postFound.coposters && postFound.coposters.length > 0) {
        for (const coposter of postFound.coposters) {
            // like on profile
            const coposterFound = await interactUserSchema.findOne({ _id: coposter });
            const foundUserLikeCount = coposterFound.likeCount ? coposterFound.likeCount + 1 : 1;
            await interactUserSchema.findOneAndUpdate({ _id: coposter }, { likeCount: foundUserLikeCount }, { upsert: true });
        }
    }

    // check if had liked previously, and only notify if not
    const postFoundLike = await interactPostLike.find({ postID, userID});
    if (postFoundLike && postFoundLike.length <= 1) pushLikeNotifications({username: foundUser.username, postData: postFoundNew});

    adjustWeight({ userID, userData: foundUser, action: "POST.LIKE", postID, postData: postFoundNew });
    
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
    if (!indexFound) return searchErrorV2("D028", { uuid: postID, type: 0 });
    
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

async function getUserLikesRouteFace({ userID, indexID=null, ownUserID }) {
    if (!userID && !indexID) return searchErrorV2("D034", { userID: "unknown" });
    if (!ownUserID) return searchErrorV2("D035", { userID: userID });

    const ownUserData = await interactUserSchema.findOne({ _id: ownUserID });
    if (!ownUserData) return searchErrorV2("D036", { userID: ownUserID });

    // get likes
    const userLikes = await getUserLikes({ userID, indexID, ownUserID, ownUserData });
    return userLikes;
}

async function getUserLikes({ userID, indexID = null, ownUserID, ownUserData = null }) {
    if (!userID && !indexID) return searchErrorV2("D034", { userID: "unknown" });
    if (!ownUserID && !ownUserData) return searchErrorV2("D035", { userID: userID });

    // get index data
    var indexFound = null;
    var userID = userID ? userID : null;
    if (indexID) {
        indexFound = await interactPostLikeIndex.findOne({ _id: indexID, type: 1 });
    } else {
        if (!userID) return searchErrorV2("D034", { userID: "unknown" });
        // Get the latest index for the user
        indexFound = await interactPostLikeIndex.findOne({ uuid: userID, type: 1, current: true });
    }

    if (!indexFound) return searchErrorV2("D029", { uuid: userID, type: 0 });
    if (!userID) userID = indexFound.uuid; 


    // check if user is valid
    const userData = await interactUserSchema.findOne({ _id: userID ? userID : indexFound.uuid });
    if (!userData) return searchErrorV2("D036", { userID: userID });

    // find own user data if not provided
    var foundOwnUser = ownUserData;
    if (!ownUserData) foundOwnUser = await interactUserSchema.findOne({ _id: ownUserID });
    if (!foundOwnUser) return searchErrorV2("D032", { userID: userID });

    // check privacy
    const canViewLikes = await checkUserRelationForPrivacy({
        userID,
        otherUserID: userData._id,
        privacyName: "likes",
        privacyOverride: userData.privacyOverride
    });

    if (!canViewLikes || canViewLikes.error) return searchErrorV2("D037", {userID: ownUserID});
    
    // format the response 
    var returnData = {
        ...indexFound._doc, // include index data
        postsLiked: []
    };

    // get all posts liked by the user
    const foundLikeData = [];
    indexFound.likes.reverse(); 

    // if less than 5, get previous index
    if (indexFound.likes.length < 5 && indexFound.prevIndexID) {
        const prevIndex = await interactPostLikeIndex.findOne({ _id: indexFound.prevIndexID, type: 1 });
        if (prevIndex && prevIndex.likes) {
            prevIndex.likes.reverse(); 
            
            indexFound.likes.push(...prevIndex.likes);
        }

        returnData.prevIndexID = prevIndex && prevIndex.prevIndexID ? prevIndex.prevIndexID : null;
    }

    for (const likeID of indexFound.likes) {
        const likeData = await interactPostLike.findOne({ _id: likeID, userID: userID, active: true });
        if (likeData) {
            foundLikeData.push(likeData);

            // get post data
            const fullPostData = await getPostWithData({ postID: likeData.postID, userID: ownUserID, ownUser: foundOwnUser });
            if (!fullPostData) continue; // skip if post not found
            returnData.postsLiked.push({...fullPostData, likeID: likeData._id, timestamp: likeData.timestamp });
        }
    }

    return returnData;
}

module.exports = {
    postIsLiked,
    likePost,
    unlikePost,
    getPostLikes,
    getPostAndUserLikeIndex,
    getUserLikes,
    getUserLikesRouteFace
};
