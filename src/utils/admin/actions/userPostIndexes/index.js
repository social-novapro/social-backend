const interactPostSchema = require("../../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../../schemas/interactUserSchema");
const interactUserPostIndexSchema = require("../../../../schemas/postSchemas/interactUserPostIndexSchema");
const { pushPostToUserPostIndex } = require("../../../post/userPostIndexManagement");

// update all user post indexes
async function updateAllUserPostIndexes({ adminID }) {
    // check adminID later
    // get all users
    const allUsers = await interactUserSchema.find({}).distinct("_id"); 

    var returnData = []
    // for each user, get all posts
    for (const userID of allUsers) {
        const userPosts = await interactPostSchema.find({ userID }).select('_id timestamp');//.distinct("_id");
        if (userPosts.length == 0) continue;

        // sort posts by timestamp, oldest first
        userPosts.sort((a, b) => a.timestamp - b.timestamp);

        var currentCount = 0;
        var indexID = null;
        for (const post of userPosts) {
            indexID = await pushPostToUserPostIndex({ userID: userID, postID: post._id, currentIndexID: indexID });
            if (indexID.error) {
                console.log("error", indexID);
                break;
            }
            currentCount++;
        }
        returnData.push({ userID, amount: currentCount, indexes: (currentCount/30) });
    }
    // final index will be used as the user's index
    return { done: true, total: allUsers.length, returnData };
}

// undo all user post indexes
async function undoAllUserPostIndexes({ adminID }) {
    // check adminID later
    const allUserPostIndexes = await interactUserPostIndexSchema.find({}).distinct("_id");

    // get all user post indexes, and delete
    for (const userIndex of allUserPostIndexes) {
        await interactUserPostIndexSchema.findOneAndDelete({ _id: userIndex });
    }

    // get all users, and unset postIndexID
    const allUsers = await interactUserSchema.find();
    for (const user of allUsers) {
        if (!user.postIndexID) continue;
        await interactUserSchema.findOneAndUpdate({ _id: user._id }, { postIndexID: null });
    }

    return { done: true };
}

module.exports = {updateAllUserPostIndexes, undoAllUserPostIndexes};
