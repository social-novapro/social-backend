const interactPostSchema = require("../../../../schemas/interactPostSchema");
const { pushPostToIndex, removePostFromIndex } = require("../../../post/postIndexManagement");

async function updateAllPostIndexes({ adminID }) {
    // check adminID later
    const allPosts = await interactPostSchema.find({});
    const allPostsLength = allPosts.length;
    var currentCount = 0;

    for (const post of allPosts) {
        if (post.indexID) continue;
        await pushPostToIndex({ postID: post._id });
        currentCount++;
        console.log(currentCount + "/" + allPostsLength);
    }
    
    return { done: true };
}

async function undoAllPostIndexes({ adminID }) {
    // check adminID later
    const allPosts = await interactPostSchema.find({});
    const allPostsLength = allPosts.length;
    var currentCount = 0;

    for (const post of allPosts) {
        if (!post.indexID) continue;
        await removePostFromIndex({ userID: post.userID, postID: post._id });

        currentCount++;
        console.log(currentCount + "/" + allPostsLength);
    }
    
    return { done: true };
}

module.exports = {updateAllPostIndexes, undoAllPostIndexes};
