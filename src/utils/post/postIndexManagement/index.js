const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostIndexSchema = require("../../../schemas/postSchemas/interactPostIndexSchema");
const { checktime } = require("../../checktime");
const { updatePostIndex, getPostIndex } = require("../../indexes");
const { v4: uuidv4 } = require('uuid');

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
    
    if (!currentIndexID) currentIndexID = await createIndex({});

    currentIndex = await interactPostIndexSchema.findOne({ _id: currentIndexID });
    if (!currentIndex) currentIndexID = await createIndex({});

    currentCount = currentIndex.amount;
    currentIndexID = currentIndex._id;
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

    await interactPostIndexSchema.findOneAndUpdate({
        _id: postData.indexID
    }, {
        $pull: { "postIDs" : {
            _id: postID
        }}
    });

    return { "success": true };
}

module.exports = { 
    exportIndex,
    pushPostToIndex,
    removePostFromIndex
}
