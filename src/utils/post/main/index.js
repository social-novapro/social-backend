const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserPostIndexSchema = require("../../../schemas/postSchemas/interactUserPostIndexSchema");
const { searchErrorV2 } = require("../../searchError");
const { getCoposts } = require("../coposter");
const { getUserPostIndex } = require("../userPostIndexManagement");

// get all posts from user index
// will always get coposts
async function getPostsFromUserIndex({ userID, indexID }) {
    const foundIndex = await getUserPostIndex({ userID, indexID });
    const foundPostIDs = [];
    if (foundIndex.amount < 5) {
        console.log("less than 5");
        // add next index
        const prevIndexID = foundIndex.prevIndexID;
        if (prevIndexID) {
            const prevIndex = await interactUserPostIndexSchema.findOne({ _id: prevIndexID });
            if (prevIndex && prevIndex.amount > 0 && prevIndex.postIDs) {
                foundPostIDs.push(...prevIndex.postIDs);
            }
        }
    } 

    if (foundIndex.postIDs) foundPostIDs.push(...foundIndex.postIDs);

    const foundPosts = [];
    for (const postID of foundPostIDs) {
        const foundPost = await interactPostSchema.findOne({_id: postID._id});
        if (foundPost && !foundPost.deleted) foundPosts.push(foundPost);
    }

    const sumIndex = {
        _id: foundIndex._id,
        nextIndexID: foundIndex.nextIndexID,
        prevIndexID: foundIndex.prevIndexID,
        amount: foundPosts.length
    }
    return {index: sumIndex, posts: foundPosts};
}

// get all posts from user
// will not always get coposts
async function getPostsFromUser({ userID, coposts }) {
    const foundPosts = await interactPostSchema.find({ userID });
    if (coposts) {
        const foundCoposts = await getCoposts({userID});
        if (foundCoposts && !foundCoposts.error && foundCoposts.length > 0) foundPosts.push(...foundCoposts);
    }

    if (foundPosts && !foundPosts.length > 0) return searchErrorV2("D013", { userID }); 
    foundPosts.sort((a, b) => a.timePosted - b.timePosted);

    return foundPosts;
}

module.exports = { getPostsFromUserIndex, getPostsFromUser };