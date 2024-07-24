

const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactFollowIndexSchema = require("../../../schemas/user/interactFollowIndexSchema");
const interactFollowSchema = require("../../../schemas/user/interactFollowSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require('uuid');

// Get Followers of user
// GET /followers
async function getFollowers({ userID, ownUserID, page }) {
    // TODO: pages, not implemented yet

    const foundFollowersIndex = await findFollowIndexID({ userID: userID, type: 1, createNew: false });
    return foundFollowersIndex;
}

// Get Following of user
// GET /following
async function getFollowing({ userID, ownUserID, page }) {
    // TODO: pages, not implemented yet

    const foundFollowingIndex = await findFollowIndexID({ userID: userID, type: 0, createNew: false });
    return foundFollowingIndex;
}

// Get shared following data
// timestamp followed + following, if mutual, etc
// GET /followActivity (?)
// make sure both users have the data public
async function getFollowActivity() {

}

// Follow user
// POST /follow
async function followUser({ userID, followedUserID}) {
    // check if followed
    const foundFollow = await findFollow({ userID, followedUserID });
    if (foundFollow.found==true) return searchErrorV2("C022", { userID });

    // make sure user exists
    const userFound = await interactUserSchema.findOne({ _id: followedUserID });
    if (!userFound) return searchErrorV2("C027", { userID });

    const foundFollowingIndex = await findFollowIndexID({ userID: userID, type: 0, createNew: true});
    const foundFollowersIndex = await findFollowIndexID({ userID: followedUserID, type: 1, createNew: true });
    
    const followUUID = uuidv4()
    const createdFollow = await interactFollowSchema.create({
        _id: followUUID,
        timestamp: checktime(),
        current: true,
        userID,
        followedUserID,
        indexFollowingID: foundFollowingIndex.indexData._id,
        indexFollowersID: foundFollowersIndex.indexData._id
    });

    await addToFollowIndexes({
        followID: followUUID,
        followingsIndex: foundFollowingIndex.indexData,
        followersIndex: foundFollowersIndex.indexData
    });

    return createdFollow;
}

// Unfollow user
// DELETE /unfollow
async function unfollowUser({userID, unfollowUserID }) {
    const foundFollow = await findFollow({ userID, followedUserID: unfollowUserID });
    if (foundFollow.found!=true) return searchErrorV2("C026", { userID });
    
    // user by default should exist
    // remove from indexes    
    await removeFromFollowIndexes({
        followID: foundFollow.followData._id,
        followingsIndex: foundFollow.followData.indexFollowingID,
        followersIndex: foundFollow.followData.indexFollowersID
    });
    
    const removedFollow = await interactFollowSchema.findOneAndUpdate({
        _id: foundFollow.followData._id
    }, {
        current: false,
        timestampUnfollowed: checktime()
    }, { 
        upsert: true
    });

    return removedFollow;
};

// Get mutual followers
// GET /mutual/followers
async function getMutualFollowers() {

}

// Get mutual following
// GET /mutual/following
async function getMutualFollowing() {

}

async function findFollow({ userID, followedUserID }) {
    const foundFollowing = await interactFollowSchema.findOne({
        current: true,
        userID,
        followedUserID
    });

    if (!foundFollowing) return { found: false };
    return {
        found: true,
        followData: foundFollowing
    };
}

// type: 0 = following, 1 = followed
async function findFollowIndexID({ userID, type, createNew }) {
    if (!userID) return searchErrorV2("C025", { userID: null });
    if (type == (null || undefined)) return searchErrorV2("C023", { userID });
    if (createNew == (null || undefined)) return searchErrorV2("C024", { userID });

    const foundIndex = await interactFollowIndexSchema.findOne({
        userID, 
        type,
        current: true
    });

    if (createNew==false && !foundIndex) return { found: false };
    if (createNew==true && !foundIndex) {
        const newIndex = await createFollowIndexID({ userID, type });
        return {
            found: true,
            indexData: newIndex
        };
    };

    if (createNew==true && foundIndex.amount>50) {
        const newIndex = await createFollowIndexID({ userID, type, prevIndex: foundIndex });
        return {
            found: true,
            indexData: newIndex
        };
    };

    return {
        found: true,
        indexData: foundIndex
    };
}

async function createFollowIndexID({ userID, type, prevIndex }) {
    const newIndexID = uuidv4();
    if (prevIndex) {
        await interactFollowIndexSchema.findOneAndUpdate({
            _id: prevIndex._id,
        }, {
            current: false,
            nextIndexID: newIndexID
        });
    };

    const newIndex = await interactFollowIndexSchema.create({
        _id: newIndexID,
        userID,
        type,
        current: true,
        prevIndexID: prevIndex? prevIndex._id : null,
        amount: 0,
        timestamp: checktime(),
        follow: []
    });

    return newIndex;
};

async function addToFollowIndexes({
    followID,
    followingsIndex,
    followersIndex
}) {
    // update following
    const newFollowIndex = await interactFollowIndexSchema.findOneAndUpdate( 
        { _id: followingsIndex._id },
        { $push : { "follow" : { 
            _id: followID,
            timestamp: checktime()
        }}},
        { upsert: true }
    );

    // update followers
    const newFollowingIndex = await interactFollowIndexSchema.findOneAndUpdate(
        { _id: followersIndex._id },
        { $push : { "follow" : { 
            _id: followID,
            timestamp: checktime()
        }}},
        { upsert: true }
    );

    return {
        newFollowIndex,
        newFollowingIndex
    };
};

async function removeFromFollowIndexes({
    followID,
    followingsIndex,
    followersIndex
}) {
    // update following
    const newFollowIndex = await interactFollowIndexSchema.findOneAndUpdate( 
        { _id: followingsIndex._id },
        { $pull : { "follow" : { 
            _id: followID
        }}},
        { upsert: true }
    );

    // update followers
    const newFollowingIndex = await interactFollowIndexSchema.findOneAndUpdate(
        { _id: followersIndex._id },
        { $pull : { "follow" : { 
            _id: followID
        }}},
        { upsert: true }
    );

    return {
        newFollowIndex,
        newFollowingIndex
    };
};

module.exports = {
    getFollowers,
    getFollowing,
    getFollowActivity,
    followUser,
    unfollowUser,
    getMutualFollowers,
    getMutualFollowing
}