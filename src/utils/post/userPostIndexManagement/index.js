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
    if (!foundIndex) return searchErrorV2("C035", { userID : userID ?? "unknown"});
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

    const foundIndex = await interactUserPostIndexSchema.findOne({ _id: postIndexID });
    if (foundIndex) {
        foundIndex.postIDs = foundIndex.postIDs.filter((post) => post._id !== postID);
        foundIndex.amount = foundIndex.postIDs.length;

        if (foundIndex.postIDs.length === 0) {
            await deleteEmptyUserPostIndex({ index: foundIndex, userID });
        } else {
            await foundIndex.save();
        }
    }

    return { "success": true };
}

async function deleteEmptyUserPostIndex({ index, indexID, userID, dryRun=false }) {
    const foundIndex = index ? index : await interactUserPostIndexSchema.findOne({ _id: indexID });
    if (!foundIndex || (foundIndex.postIDs && foundIndex.postIDs.length > 0)) {
        return {
            deleted: false,
            indexID: foundIndex ? foundIndex._id : indexID,
            userID,
            reason: foundIndex ? "not-empty" : "not-found"
        };
    }

    const indexUserID = userID || foundIndex.userID;
    const replacementIndexID = foundIndex.nextIndexID || foundIndex.prevIndexID || null;

    if (dryRun) {
        return {
            deleted: false,
            wouldDelete: true,
            indexID: foundIndex._id,
            userID: indexUserID,
            replacementIndexID
        };
    }

    if (foundIndex.prevIndexID) {
        await interactUserPostIndexSchema.findOneAndUpdate(
            { _id: foundIndex.prevIndexID },
            { nextIndexID: foundIndex.nextIndexID || null }
        );
    }

    if (foundIndex.nextIndexID) {
        await interactUserPostIndexSchema.findOneAndUpdate(
            { _id: foundIndex.nextIndexID },
            { prevIndexID: foundIndex.prevIndexID || null }
        );
    }

    await interactUserPostIndexSchema.deleteOne({ _id: foundIndex._id });

    const userFound = indexUserID ? await interactUserSchema.findOne({ _id: indexUserID }) : null;
    if (userFound && userFound.postIndexID === foundIndex._id) {
        await interactUserSchema.findOneAndUpdate(
            { _id: indexUserID },
            { postIndexID: replacementIndexID }
        );
    }

    return {
        deleted: true,
        indexID: foundIndex._id,
        userID: indexUserID,
        replacementIndexID
    };
}

async function getLiveUserPostIDs(postIDs) {
    const livePostIDs = [];

    for (const post of postIDs || []) {
        const postID = post && post._id;
        if (!postID) continue;

        const foundPost = await interactPostSchema.findOne({
            _id: postID,
            deleted: { $ne: true }
        }).select('_id').lean();

        if (foundPost) livePostIDs.push({ _id: postID });
    }

    return livePostIDs;
}

async function pruneUserPostIndex({ index, dryRun=false }) {
    const originalCount = index.postIDs ? index.postIDs.length : 0;
    const originalAmount = index.amount;
    const livePostIDs = await getLiveUserPostIDs(index.postIDs);
    const changed = livePostIDs.length !== originalCount || originalAmount !== livePostIDs.length;

    if (!changed) {
        return {
            changed: false,
            indexID: index._id,
            userID: index.userID,
            from: originalAmount,
            to: livePostIDs.length
        };
    }

    if (!dryRun) {
        index.postIDs = livePostIDs;
        index.amount = livePostIDs.length;
        if (livePostIDs.length > 0) await index.save();
    }

    return {
        changed: true,
        indexID: index._id,
        userID: index.userID,
        from: originalAmount,
        to: livePostIDs.length,
        removedPostIDs: originalCount - livePostIDs.length
    };
}

async function cleanupEmptyUserPostIndexes({ dryRun=false }={}) {
    const indexIDs = await interactUserPostIndexSchema.find({}).distinct("_id");
    const deletedIndexes = [];
    const correctedIndexes = [];
    const prunedIndexes = [];

    for (const indexID of indexIDs) {
        const index = await interactUserPostIndexSchema.findOne({ _id: indexID });
        if (!index) continue;

        const pruned = await pruneUserPostIndex({ index, dryRun });
        if (pruned.changed && pruned.removedPostIDs > 0) prunedIndexes.push(pruned);

        const postCount = pruned.to;
        if (postCount === 0) {
            const deleted = dryRun
                ? {
                    deleted: false,
                    wouldDelete: true,
                    indexID: index._id,
                    userID: index.userID,
                    replacementIndexID: index.nextIndexID || index.prevIndexID || null
                }
                : await deleteEmptyUserPostIndex({ index, userID: index.userID, dryRun });
            if (deleted.deleted || deleted.wouldDelete) deletedIndexes.push(deleted);
            continue;
        }

        if (pruned.from !== postCount) {
            correctedIndexes.push({
                indexID: index._id,
                userID: index.userID,
                from: pruned.from,
                to: postCount
            });
            if (!dryRun && !pruned.changed) {
                index.amount = postCount;
                await index.save();
            }
        }
    }

    return {
        deletedIndexes,
        correctedIndexes,
        prunedIndexes
    };
}

module.exports = {
    createUserPostIndex,
    getUserPostIndex,
    pushPostToUserPostIndex,
    removePostFromUserPostIndex,
    getUserPostIndex,
    deleteEmptyUserPostIndex,
    cleanupEmptyUserPostIndexes
};
