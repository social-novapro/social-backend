const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactFollowIndexSchema = require("../../../schemas/user/interactFollowIndexSchema");
const interactFollowSchema = require("../../../schemas/user/interactFollowSchema");
const { checktime } = require("../../checktime");
const { getPrivacySetting } = require("../../privacy");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require('uuid');
const INDEX_LIMIT = 20;

/* TODO
[+] get pages working
    - mainly for get following and followers
    [+] if amount < 10, add a next page, do in prettyFollowList()
    (test followers list, following list works)
[-] get mutual followers
    - who are they following that you follow
[-] get mutual following
    - who follows you and you follow them
[-] get friends
    - you are both following each other
[-] get follow activity 
    - can include previous follows, unfollows, etc
[-] get follow suggestions
    - based on mutual followers, following, etc (?)
[.5] privacy settings for follows
    - public, private
*/

// Get Followers of user
// GET /followers
async function getFollowers({ userID, ownUserID, indexID }) {
    const foundFollowersIndex = await findFollowIndexID({ 
        userID,
        indexID : indexID ? indexID: null,
        type: 1,
        createNew: false
    });

    if (!foundFollowersIndex.found) return foundFollowersIndex;
    const finalFollowList = await prettyFollowList({
        userID,
        ownUserID,
        followIndex: foundFollowersIndex.indexData
    });

    return finalFollowList;
}

// Get Following of user
// GET /following
async function getFollowing({ userID, ownUserID, indexID }) {
    const foundFollowingIndex = await findFollowIndexID({ 
        userID,
        indexID : indexID ? indexID: null,
        type: 0, 
        createNew: false
    });

    if (!foundFollowingIndex.found) return foundFollowingIndex;
    const finalFollowList = await prettyFollowList({
        userID,
        ownUserID,
        followIndex: foundFollowingIndex.indexData
    });

    return finalFollowList;
}

async function prettyFollowList({ userID, ownUserID, followIndex }) {
    var finalFollowList = {
        found: true,
        followIndexID: followIndex._id,
        prevIndexID: followIndex.prevIndexID,
        nextIndexID: followIndex.nextIndexID ? followIndex.nextIndexID : null,
        timestamp: followIndex.timestamp,
        current: followIndex.current,
        type: followIndex.type,
        userID: followIndex.userID,
        amount: followIndex.amount,
        includedIndexes: [followIndex._id],
        follows: followIndex.follows,
        data: [], // { followData, userData }
    };

    if ((followIndex.prevIndexID!=null) && (followIndex.amount<5)) {
        // console.log("doing next")
        const prevIndex = await findFollowIndexID({
            userID,
            indexID: followIndex.prevIndexID,
            type: 0,
            createNew: false
        });

        if (prevIndex.found == true) {
            finalFollowList.follows = finalFollowList.follows.concat(prevIndex.indexData.follows);
            finalFollowList.prevIndexID = prevIndex.indexData.prevIndexID;
            finalFollowList.amount += prevIndex.indexData.amount;
            finalFollowList.includedIndexes.push(prevIndex.indexData._id);
        };
    }

    if (!finalFollowList.follows || finalFollowList.follows<0) return finalFollowList;
    for (const followID of finalFollowList.follows) {
        const foundFollow = await interactFollowSchema.findOne({_id: followID})
        const foundUser = await interactUserSchema.findOne({
            _id: followIndex.type==0? foundFollow.followedUserID : foundFollow.userID
        });

        // if user following looking at
        var followed = false;
        if (ownUserID == foundFollow.userID) {
            followed = true;
        } else {
            const foundFollow = await findFollow({ userID: ownUserID, followedUserID: foundUser._id });
            if (foundFollow.found==true) followed = true;
        }

        finalFollowList.data.push({
            followData: foundFollow,
            userData: {...foundUser._doc, followed}
        });
    }

    return finalFollowList;
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
    // check if followedUserID was provided
    if (!followedUserID) return searchErrorV2("C021", { userID });
    // check if user is following themselves
    if (userID == followedUserID) return searchErrorV2("C028", { userID });

    // check if followed
    const foundFollow = await findFollow({ userID, followedUserID });
    if (foundFollow.found==true) return searchErrorV2("C022", { userID });

    // make sure user exists
    const userFound = await interactUserSchema.findOne({ _id: followedUserID });
    if (!userFound) return searchErrorV2("C027", { userID });

    // make sure user can follow
    var canFollow = false
    const followPrivacy = await getPrivacySetting({ userID: followedUserID, privacy: "follow" });
    // TODO: need to change 2
    if (followPrivacy==1 || followPrivacy==2) canFollow = true;
    if (followPrivacy==5) {
        const foundFollow = await findFollow({ userID: followedUserID, followedUserID: userID });
        if (foundFollow?.found==true) canFollow = true
    }

    if (canFollow==false) return searchErrorV2("C030", { userID });

    // get indexes
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

    await updateUserFolllowFollowingCount({ 
        userID,
        followedUserID: followedUserID,
        change: "add"
    });

    return createdFollow;
}

// Unfollow user
// DELETE /unfollow
async function unfollowUser({userID, unfollowUserID }) {
    if (!unfollowUserID) return searchErrorV2("C021", { userID });
    if (userID == unfollowUserID) return searchErrorV2("C029", { userID });

    const foundFollow = await findFollow({ userID, followedUserID: unfollowUserID });
    if (foundFollow.found!=true) return searchErrorV2("C026", { userID });
    
    const removedFollow = await interactFollowSchema.findOneAndUpdate({
        _id: foundFollow.followData._id
    }, {
        current: false,
        timestampUnfollowed: checktime()
    }, { 
        upsert: true
    });

    // user by default should exist
    // remove from indexes    
    await removeFromFollowIndexes({
        followID: foundFollow.followData._id,
        followingsIndex: foundFollow.followData.indexFollowingID,
        followersIndex: foundFollow.followData.indexFollowersID
    });
    
    await updateUserFolllowFollowingCount({ 
        userID,
        followedUserID: unfollowUserID,
        change: "remove"
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

// find if user is following another user
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
async function findFollowIndexID({ userID, indexID, type, createNew }) {
    if (!userID) return searchErrorV2("C025", { userID: null });
    if (type == (null || undefined)) return searchErrorV2("C023", { userID });
    if (createNew == (null || undefined)) return searchErrorV2("C024", { userID });

    // if indexID is provided, return that index
    if (indexID) {
        const foundSpecificIndex = await interactFollowIndexSchema.findOne({
            _id: indexID
        });
        if (!foundSpecificIndex) return { found: false };

        // newest first, oldest last
        foundSpecificIndex.follows.reverse();

        return {
            found: true,
            indexData: foundSpecificIndex
        };
    }

    const foundIndex = await interactFollowIndexSchema.findOne({
        userID, 
        type,
        current: true
    });

    // newest first, oldest last
    if (foundIndex && foundIndex.folllows) foundIndex.follows?.reverse();

    if (createNew==false && !foundIndex) return { found: false };
    if (createNew==true && !foundIndex) {
        const newIndex = await createFollowIndexID({ userID, type });
        return {
            found: true,
            indexData: newIndex
        };
    };

    if (createNew==true && foundIndex.amount>=INDEX_LIMIT) {
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
        follows: []
    });

    return newIndex;
};

async function addToFollowIndexes({
    followID,
    followingsIndex,
    followersIndex
}) {
    // update following
    const newFollowerIndex = await interactFollowIndexSchema.findOneAndUpdate( 
        { _id: followingsIndex._id },
        { 
            $push : { follows: followID },
            $inc: { amount: 1 }
        },
        { upsert: true }
    );

    // update followers
    const newFollowingIndex = await interactFollowIndexSchema.findOneAndUpdate(
        { _id: followersIndex._id },
        { 
            $push : { follows: followID },
            $inc: { amount: 1 }
        },
        { upsert: true }
    );

    return {
        newFollowerIndex,
        newFollowingIndex
    };
};

async function removeFromFollowIndexes({
    followID,
    followingsIndex,
    followersIndex
}) {
    // update following
    const newFollowerIndex = await interactFollowIndexSchema.findOneAndUpdate( 
        { _id: followingsIndex },
        { 
            $pull : { follows: followID },
            $inc: { amount: -1}
        },
        { upsert: true }
    );

    // update followers
    const newFollowingIndex = await interactFollowIndexSchema.findOneAndUpdate(
        { _id: followersIndex },
        { 
            $pull : { follows: followID },
            $inc: { amount: -1}
        },
        { upsert: true }
    );

    return {
        newFollowerIndex,
        newFollowingIndex
    };
};

// update user following and followers count
async function updateUserFolllowFollowingCount({ userID, followedUserID, change}) {
    if (change=="add") {
        await interactUserSchema.findOneAndUpdate(
            { _id: userID },
            { $inc: { followingCount: 1 } }
        );

        await interactUserSchema.findOneAndUpdate(
            { _id: followedUserID },
            { $inc: { followerCount: 1 } }
        );
    } else if (change=="remove") {
        await interactUserSchema.findOneAndUpdate(
            { _id: userID },
            { $inc: { followingCount: -1 } }
        );

        await interactUserSchema.findOneAndUpdate(
            { _id: followedUserID },
            { $inc: { followerCount: -1 } }
        );
    };
}

module.exports = {
    getFollowers,
    getFollowing,
    getFollowActivity,
    followUser,
    unfollowUser,
    getMutualFollowers,
    getMutualFollowing,
    findFollow
}