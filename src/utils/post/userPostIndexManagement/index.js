const { v4: uuidv4 } = require('uuid');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPostIndexSchema = require('../../../schemas/postSchemas/interactUserPostIndexSchema');
const { checktime } = require('../../checktime');
const interactPostSchema = require('../../../schemas/interactPostSchema');

const MAX_POSTS_PER_USER_INDEX = 30;

// create a user post index
async function createUserPostIndex({ userID, prevIndexID }) {
    // set to user schema
    const indexID = uuidv4();
    await interactUserSchema.findOneAndUpdate({ _id: userID }, { postIndexID: indexID });

    // create empty index
    await interactUserPostIndexSchema.create({
        _id: indexID,
        userID: userID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null,
        nextIndexID: null
    });

    if (prevIndexID) {
        // update previous index
        await interactUserPostIndexSchema.findOneAndUpdate({ _id: prevIndexID }, { nextIndexID: indexID });
    }

    return indexID;
}

// get current user post index, or specific user post index
async function getUserPostIndex({ userID, indexID }) {
    var userIndexID = indexID ? indexID : null;
    if (!userIndexID) {
        userIndexID = await getCurrentUserPostIndexID({ userID });
        if (!userIndexID || userIndexID.error) return userIndexID;//{ error: true, msg: "could not get index" };
        // get current user post index
    }

    const foundIndex = await interactUserPostIndexSchema.findOne({ _id: userIndexID });
    if (!foundIndex) return { error: true, msg: "index not found" };

    return foundIndex;
}

async function getCurrentUserPostIndexID({ userID, createNew }) {
    const userFound = await interactUserSchema.findOne({_id: userID});
    if (!userFound) return { error: true, msg: "user not found while looking for index id" };
    // console.log(userFound);
    if (userFound.postIndexID == null && createNew == true) {
        const newIndexID = await createUserPostIndex({userID});
        if (!newIndexID || newIndexID.error) return newIndexID;//return { error: true, msg: "could not create new index" };

        return newIndexID;
    } else if (userFound.postIndexID == null) return { error: true, msg: "no index found with user" };

    return userFound.postIndexID;
}

async function pushPostToUserPostIndex({ userID, postID, currentIndexID }) {
    console.log("PUSHING", postID, currentIndexID);
    // const post = await interactPostSchema.findOne
    // can provide which index to use (other than if index over max)
    var useIndexID = null;
    if (!currentIndexID) useIndexID = await getCurrentUserPostIndexID({ userID, createNew: true });
    else useIndexID = currentIndexID;
    
    if (!useIndexID || useIndexID.error) return useIndexID//{ error: true, msg: "indexID not provided" };

    var foundIndex = await interactUserPostIndexSchema.findOne({ _id: useIndexID });
    if (!foundIndex) return { error: true, msg: "index not found" };

    if (foundIndex.amount >= MAX_POSTS_PER_USER_INDEX) {
        const newIndexID = await createUserPostIndex({ userID, prevIndexID: useIndexID });
        if (!newIndexID || newIndexID.error) return newIndexID;//{ error: true, msg: "could not create new index" };
        // update data
        useIndexID = newIndexID;
        foundIndex = await interactUserPostIndexSchema.findOne({ _id: useIndexID });
    }

    // add postID to index
    // and increment amount
    console.log("ADDING", useIndexID, postID);
    await interactUserPostIndexSchema.findOneAndUpdate({ 
        _id: useIndexID 
    }, {
        amount: foundIndex.amount + 1,
        $push: { postIDs: {_id: postID} },
    });

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        userPostIndexID: useIndexID
    });

    return useIndexID;
}

async function getUserPostIndexIDfromPostID({ postID }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID });
    if (!foundPost) return { error: true, msg: "post not found" };

    const userIndexID = foundPost.userPostIndexID;
    if (!userIndexID) return { error: true, msg: "post not in any index" };

    return userIndexID;
}

async function removePostFromUserPostIndex({ userID, postID, userPostIndexID }) {
    const postIndexID = userPostIndexID ? userPostIndexID 
        : await getUserPostIndexIDfromPostID({ userID }); // seems not to work, already deleted by this point

    if (!postIndexID || postIndexID.error) return postIndexID;

    console.log("FOUND INDEX", postIndexID);

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        userPostIndexID: null
    });

    await interactUserPostIndexSchema.findOneAndUpdate({
        _id: postIndexID
    }, {
        $inc: { amount: -1 },
        $pull: { postIDs: { _id: postID } }
    });
    // check if need to remove / revert index
    // maybe dont need to, because if index is less than 5 itll include last index

    return { "success": true };
}

module.exports = {
    createUserPostIndex,
    getUserPostIndex,
    pushPostToUserPostIndex,
    removePostFromUserPostIndex,
    getUserPostIndex
};