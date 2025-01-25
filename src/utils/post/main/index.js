const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserPostIndexSchema = require("../../../schemas/postSchemas/interactUserPostIndexSchema");
const { searchErrorV2 } = require("../../searchError");
const { getCoposts } = require("../coposter");

async function getPostsFromUserIndex({ userID, coposts, indexID }) {
    var useIndexID = indexID ? indexID : null;
    const foundIndex = await interactUserPostIndexSchema.findOne({ _id: indexID });
    if (!foundIndex)  return { error: true, errorCode: "0000", msg: "not found", userID };

    const foundPosts = [];
    for (const postID of foundIndex.postIDs) {
        const foundPost = await interactPostSchema.findOne({_id: postID});
        if (foundPost && !foundPost.deleted) foundPosts.push(foundPost);
    }

    return foundPosts;
}

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