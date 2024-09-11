const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostCoSchema = require("../../../schemas/postSchemas/interactPostCoSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");

async function getCopostRequests({userID}) {
    const copostRequests = await interactPostCoSchema.find({ 
        userID,
        deletedPost: false,
        declined: false,
        approved: false 
    });

    if (!copostRequests || !copostRequests.length > 0) return searchErrorV2("D018", { userID });
    var foundData = [];

    for (const copost of copostRequests) {
        const foundPost = await interactPostSchema.findOne({_id: copost.postID});
        if (foundPost) {
            const foundUser = await interactUserSchema.findOne({_id: copost.userID});
            
            foundData.push({
                request: copost,
                post: foundPost,
                user: foundUser ? foundUser : null
            });
        } 
    }

    if (!foundData || !foundData.length > 0) return searchErrorV2("D018", { userID });

    return foundData;
}

async function getCoposts({userID}) {
    const foundCoposts = await interactPostCoSchema.find({
        userID,
        approved: true
    });

    if (!foundCoposts || !foundCoposts.length > 0) return searchErrorV2("D019", { userID });

    var foundPosts = [];
    for (const copost of foundCoposts) {
        const foundPost = await interactPostSchema.findOne({_id: copost.postID})
        if (foundPost) foundPosts.push(foundPost);
    }

    if (!foundPosts || !foundPosts.length > 0) return searchErrorV2("D019", { userID });
    return foundPosts;
}

async function approveCopost({requestID, userID}) {
    const foundRequest = await interactPostCoSchema.findOne({_id: requestID});
    if (!foundRequest) return searchErrorV2("D020", { userID });
    if (foundRequest.userID !== userID) return searchErrorV2("D021", {  userID });
    if (foundRequest.approved) return searchErrorV2("D022", { userID });

    const foundPost = await interactPostSchema.findOne({_id: foundRequest.postID});
    if (!foundPost) {
        foundRequest.deletedPost = true;
        await foundRequest.save();
        return searchErrorV2("D024", { userID });
    }

    foundRequest.approved = true;
    foundRequest.approvedTimestamp = checktime()

    // removes if already declined
    if (foundRequest.declined) {
        foundRequest.declined = false;
    }
        
    await foundRequest.save();

    await interactPostSchema.updateOne({_id: foundRequest.postID}, {
        $push: {
            coposters: userID
        }
    });

    return foundRequest;
}

async function declineCopost({requestID, userID}) {
    const foundRequest = await interactPostCoSchema.findOne({_id: requestID});
    if (!foundRequest) return searchErrorV2("D020", { userID });
    if (foundRequest.userID !== userID) return searchErrorV2("D021", {  userID });
    if (foundRequest.declined) return searchErrorV2("D023", { userID });

    foundRequest.declined = true;
    foundRequest.approvedTimestamp = checktime()

    // removes if already approved
    if (foundRequest.approved) {
        foundRequest.approved = false;
        await interactPostSchema.updateOne({_id: foundRequest.postID}, {
            $pull: {
                coposters: userID
            }
        });
    }

    await foundRequest.save();
    return foundRequest;
}

module.exports = { 
    getCopostRequests,
    getCoposts,
    approveCopost,
    declineCopost
 };