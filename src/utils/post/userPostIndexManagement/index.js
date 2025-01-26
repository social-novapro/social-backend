const { v4: uuidv4 } = require('uuid');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPostIndexSchema = require('../../../schemas/postSchemas/interactUserPostIndexSchema');
const { checktime } = require('../../checktime');
const interactPostSchema = require('../../../schemas/interactPostSchema');
const { searchErrorV2 } = require('../../searchError');

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
        // get current user post index
        userIndexID = await getCurrentUserPostIndexID({ userID });
        if (!userIndexID || userIndexID.error) return userIndexID;
    }

    const foundIndex = await interactUserPostIndexSchema.findOne({ _id: userIndexID });
    if (!foundIndex) return searchErrorV2("C035", { userID });
    return foundIndex;
}

// Get current userPostIndexID
async function getCurrentUserPostIndexID({ userID, createNew }) {
    const userFound = await interactUserSchema.findOne({_id: userID});
    if (!userFound) return searchErrorV2("C036", { userID });
    if (userFound.postIndexID == null && createNew == true) {
        const newIndexID = await createUserPostIndex({userID});
        if (!newIndexID || newIndexID.error) return newIndexID;
        return newIndexID;
    } else if (userFound.postIndexID == null) return searchErrorV2("C037", { userID });
    return userFound.postIndexID;
}

// Push a post to user's post index (via provided or current index)
async function pushPostToUserPostIndex({ userID, postID, currentIndexID }) {
    // can provide which index to use (other than if index over max)
    var useIndexID = null;
    if (!currentIndexID) useIndexID = await getCurrentUserPostIndexID({ userID, createNew: true });
    else useIndexID = currentIndexID;
    
    if (!useIndexID || useIndexID.error) return useIndexID;

    var foundIndex = await interactUserPostIndexSchema.findOne({ _id: useIndexID });
    if (!foundIndex) return searchErrorV2("C035", { userID });

    if (foundIndex.amount >= MAX_POSTS_PER_USER_INDEX) {
        const newIndexID = await createUserPostIndex({ userID, prevIndexID: useIndexID });
        if (!newIndexID || newIndexID.error) return newIndexID;
        // update data
        useIndexID = newIndexID;
        foundIndex = await interactUserPostIndexSchema.findOne({ _id: useIndexID });
    }

    // add postID to index
    // and increment amount
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

// Get userPostIndexID from postID
async function getUserPostIndexIDfromPostID({ userID, postID }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID });
    if (!foundPost) return searchErrorV2("C038", { userID });

    const userIndexID = foundPost.userPostIndexID;
    if (!userIndexID) return searchErrorV2("C039", { userID });

    return userIndexID;
}

// Remove post from user's post index
async function removePostFromUserPostIndex({ userID, postID, userPostIndexID }) {
    const postIndexID = userPostIndexID ? userPostIndexID 
        : await getUserPostIndexIDfromPostID({ userID, postID }); // seems not to work, already deleted by this point

    if (!postIndexID || postIndexID.error) return postIndexID;

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