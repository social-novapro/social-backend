const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostIndexSchema = require("../../../schemas/postSchemas/interactPostIndexSchema");
const { checktime } = require("../../checktime");
const { updatePostIndex, getPostIndex } = require("../../indexes");
const { v4: uuidv4 } = require('uuid');
const { searchErrorV2 } = require("../../searchError");

/* these must always be set */
var currentCount = 0;
var currentIndex = null;
var currentIndexID = null;

/* creates new index */
async function createIndex({ prevIndexID }) {
    const indexID = uuidv4();

    currentCount = 0;
    currentIndexID = indexID;
    currentIndex = null;

    await interactPostIndexSchema.create({
        _id: indexID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null
    });

    if (prevIndexID) {
        await interactPostIndexSchema.findOneAndUpdate({
            _id: prevIndexID
        }, {
            nextIndexID: indexID
        });
    }

    currentIndex = await interactPostIndexSchema.findOne({ _id: indexID });
    
    await updatePostIndex({ indexID });
    return indexID;
}

/* prepares a list of posts for discovery */
async function exportIndex({ userID, indexID }) {
};

/* gets current index, and sets file variables */
async function getCurrentIndex() {
    currentIndexID = await getPostIndex();
    
    // TODO: possible fix this, duplicating ?
    if (!currentIndexID) {
        const repairedIndexID = await repairPostIndexPointer();
        currentIndexID = repairedIndexID || await createIndex({});
    }

    currentIndex = await interactPostIndexSchema.findOne({ _id: currentIndexID });
    if (!currentIndex) {
        const repairedIndexID = await repairPostIndexPointer();
        currentIndexID = repairedIndexID || await createIndex({});
        currentIndex = await interactPostIndexSchema.findOne({ _id: currentIndexID });
    }

    currentCount = currentIndex.amount;
    currentIndexID = currentIndex._id;
}

async function getPostIndexData({ indexID }) {
    if (!indexID) {
        if (!currentIndex) await getCurrentIndex();
        return currentIndex;
    } else {
        const foundIndex = await interactPostIndexSchema.findOne({ _id: indexID });
        if (!foundIndex) return null;
        return foundIndex;
    }
}

/* adds postID to index */
async function pushPostToIndex({ postID }) {
    if (!currentIndex) await getCurrentIndex();
    const usedIndexID = currentIndexID;

    currentCount++;

    // updates count and adds post
    await interactPostIndexSchema.findOneAndUpdate({
        _id: currentIndexID
    }, {
        amount: currentCount,
        $push: { "postIDs" : {
            _id: postID
        }}
    });

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        indexID: currentIndexID
    });
    currentIndex.postIDs.push({ _id: postID });

    if (currentCount >= 50) {
        const indexIDnew = await createIndex({ prevIndexID: currentIndexID });
        currentIndex = await interactPostIndexSchema.findOne({ _id: indexIDnew });
    }

    return usedIndexID;
}

async function getPostData({ postID, requestingUser }) {
    const foundPost = await interactPostSchema.findOne({ _id: postID })
    if (!foundPost) return null;
    if (foundPost.userID == requestingUser) return foundPost;
    else return foundPost;
}

async function removePostFromIndex({ userID, postID }) {
    const postData = await getPostData({ postID, requestingUser: userID });
    if (!postData) return searchErrorV2("S013", { userID });
    if (!postData.indexID) return searchErrorV2("S014", { userID });

    const foundIndex = await interactPostIndexSchema.findOne({ _id: postData.indexID });
    if (foundIndex) {
        foundIndex.postIDs = foundIndex.postIDs.filter((post) => post._id !== postID);
        foundIndex.amount = foundIndex.postIDs.length;

        if (foundIndex.postIDs.length === 0) {
            await deleteEmptyPostIndex({ index: foundIndex });
        } else {
            await foundIndex.save();
            if (currentIndexID === foundIndex._id) {
                currentIndex = foundIndex;
                currentCount = foundIndex.amount;
            }
        }
    }

    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {
        indexID: null
    });

    return { "success": true };
}

async function deleteEmptyPostIndex({ index, indexID, dryRun=false }) {
    const foundIndex = index ? index : await interactPostIndexSchema.findOne({ _id: indexID });
    if (!foundIndex || (foundIndex.postIDs && foundIndex.postIDs.length > 0)) {
        return {
            deleted: false,
            indexID: foundIndex ? foundIndex._id : indexID,
            reason: foundIndex ? "not-empty" : "not-found"
        };
    }

    const replacementIndexID = foundIndex.nextIndexID || foundIndex.prevIndexID || await findFallbackPostIndexID({
        excludeIndexID: foundIndex._id
    });

    if (dryRun) {
        return {
            deleted: false,
            wouldDelete: true,
            indexID: foundIndex._id,
            replacementIndexID
        };
    }

    if (foundIndex.prevIndexID) {
        await interactPostIndexSchema.findOneAndUpdate(
            { _id: foundIndex.prevIndexID },
            { nextIndexID: foundIndex.nextIndexID || null }
        );
    }

    if (foundIndex.nextIndexID) {
        await interactPostIndexSchema.findOneAndUpdate(
            { _id: foundIndex.nextIndexID },
            { prevIndexID: foundIndex.prevIndexID || null }
        );
    }

    await interactPostIndexSchema.deleteOne({ _id: foundIndex._id });

    const activePostIndexID = await getPostIndex();
    if (activePostIndexID === foundIndex._id) {
        await updatePostIndex({ indexID: replacementIndexID });
        currentIndexID = replacementIndexID;
        currentIndex = replacementIndexID ? await interactPostIndexSchema.findOne({ _id: replacementIndexID }) : null;
        currentCount = currentIndex ? currentIndex.amount : 0;
    }

    return {
        deleted: true,
        indexID: foundIndex._id,
        replacementIndexID
    };
}

async function getLivePostIDs(postIDs) {
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

async function prunePostIndex({ index, dryRun=false }) {
    const originalCount = index.postIDs ? index.postIDs.length : 0;
    const originalAmount = index.amount;
    const livePostIDs = await getLivePostIDs(index.postIDs);
    const changed = livePostIDs.length !== originalCount || originalAmount !== livePostIDs.length;

    if (!changed) {
        return {
            changed: false,
            indexID: index._id,
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
        from: originalAmount,
        to: livePostIDs.length,
        removedPostIDs: originalCount - livePostIDs.length
    };
}

async function findFallbackPostIndexID({ excludeIndexID }={}) {
    const indexes = await interactPostIndexSchema.find({}).sort({ timestamp: -1 });

    for (const index of indexes) {
        if (excludeIndexID && index._id === excludeIndexID) continue;

        const livePostIDs = await getLivePostIDs(index.postIDs);
        if (livePostIDs.length > 0) return index._id;
    }

    return null;
}

async function repairPostIndexPointer({ dryRun=false }={}) {
    const activePostIndexID = await getPostIndex();
    const activeIndex = activePostIndexID ? await interactPostIndexSchema.findOne({ _id: activePostIndexID }) : null;
    const activeLivePostIDs = activeIndex ? await getLivePostIDs(activeIndex.postIDs) : [];

    if (activeIndex && activeLivePostIDs.length > 0) {
        return activeIndex._id;
    }

    const replacementIndexID = await findFallbackPostIndexID({
        excludeIndexID: activeIndex ? activeIndex._id : null
    });

    if (!dryRun && replacementIndexID !== activePostIndexID) {
        await updatePostIndex({ indexID: replacementIndexID });
        currentIndexID = replacementIndexID;
        currentIndex = replacementIndexID ? await interactPostIndexSchema.findOne({ _id: replacementIndexID }) : null;
        currentCount = currentIndex ? currentIndex.amount : 0;
    }

    return replacementIndexID;
}

async function cleanupEmptyPostIndexes({ dryRun=false }={}) {
    const indexIDs = await interactPostIndexSchema.find({}).distinct("_id");
    const deletedIndexes = [];
    const correctedIndexes = [];
    const prunedIndexes = [];

    for (const indexID of indexIDs) {
        const index = await interactPostIndexSchema.findOne({ _id: indexID });
        if (!index) continue;

        const pruned = await prunePostIndex({ index, dryRun });
        if (pruned.changed && pruned.removedPostIDs > 0) prunedIndexes.push(pruned);

        const postCount = pruned.to;
        if (postCount === 0) {
            const deleted = dryRun
                ? {
                    deleted: false,
                    wouldDelete: true,
                    indexID: index._id,
                    replacementIndexID: index.nextIndexID || index.prevIndexID || null
                }
                : await deleteEmptyPostIndex({ index, dryRun });
            if (deleted.deleted || deleted.wouldDelete) deletedIndexes.push(deleted);
            continue;
        }

        if (pruned.from !== postCount) {
            correctedIndexes.push({
                indexID: index._id,
                from: pruned.from,
                to: postCount
            });
            if (!dryRun && !pruned.changed) {
                index.amount = postCount;
                await index.save();
            }
        }
    }

    const pointerReplacementIndexID = await repairPostIndexPointer({ dryRun });

    return {
        deletedIndexes,
        correctedIndexes,
        prunedIndexes,
        pointerReplacementIndexID
    };
}

module.exports = { 
    exportIndex,
    getCurrentIndex,
    getPostIndexData,
    pushPostToIndex,
    removePostFromIndex,
    deleteEmptyPostIndex,
    cleanupEmptyPostIndexes,
    repairPostIndexPointer
}
