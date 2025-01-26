const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserPostIndexSchema = require("../../../schemas/postSchemas/interactUserPostIndexSchema");
const { searchErrorV2 } = require("../../searchError");
const { getCoposts } = require("../coposter");
const { getUserPostIndex } = require("../userPostIndexManagement");

async function getPostsFromUserIndex({ userID, coposts, indexID }) {
    const foundIndex = await getUserPostIndex({ userID, indexID });
    // var useIndexID = indexID ? indexID : null;
    // // or current index?
    // if (!useIndexID) {
    //     const foundUser = await interactUserSchema.findOne({_id: userID});


    // const foundIndex = await interactUserPostIndexSchema.findOne({ _id: useIndexID });
    // console.log(foundIndex);
    // if (!foundIndex)  return { error: true, errorCode: "0000", msg: "not found", userID };
    
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
    foundPostIDs.push(...foundIndex.postIDs);

    const foundPosts = [];
    for (const postID of foundPostIDs) {
        // console.log(postID)
        const foundPost = await interactPostSchema.findOne({_id: postID._id});
        // console.log(foundPost)
        if (foundPost && !foundPost.deleted) foundPosts.push(foundPost);
    }

    // console.log(foundPosts);

    return {index: foundIndex, posts: foundPosts};
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