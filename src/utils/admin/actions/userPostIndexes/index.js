const interactPostSchema = require("../../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../../schemas/interactUserSchema");
const { checktime } = require("../../../checktime");
const { pushPostToIndex, removePostFromIndex } = require("../../../post/postIndexManagement");

async function updateAllUserPostIndexes({ adminID }) {
    // check adminID later

    // get all users
    const allUsers = await interactUserSchema.find({}).distinct("_id"); 

    // for each user, get all posts
    for (const userID of allUsers) {
        const starttime = checktime();
        const userPosts = await interactPostSchema.find({ userID }).select('_id timestamp');//.distinct("_id");
        const endtime = checktime();
        if (userPosts.length == 0) continue;
        console.log(userPosts, endtime-starttime);

        // sort posts by timestamp, oldest first
        userPosts.sort((a, b) => a.timestamp - b.timestamp);

        // push each post to index divided by 30
        var currentCount = 0;
        for (const post of userPosts) {
            await pushPostToUserIndex({ postID: post._id });
            currentCount++;
            console.log(currentCount + "/" + userPosts.length);
        }
        

    }
    // final index will be used as the user's index


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

async function undoAllUserPostIndexes({ adminID }) {
    // check adminID later
    const allPosts = await interactPostSchema.find({});
    const allPostsLength = allPosts.length;
    var currentCount = 0;

    for (const post of allPosts) {
        if (!post.indexID) continue;
        //await interactPostSchema.findOneAndUpdate({ _id: post._id }, { indexID: null });
        await removePostFromIndex({ userID: post.userID, postID: post._id });

        currentCount++;
        console.log(currentCount + "/" + allPostsLength);
    }
    
    return { done: true };
}

module.exports = {updateAllUserPostIndexes, undoAllUserPostIndexes};
