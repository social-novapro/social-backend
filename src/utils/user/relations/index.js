const interactFollowSchema = require("../../../schemas/user/interactFollowSchema");
const { checktime } = require("../../checktime");
const { areUserFriends, areUsersFriendsOfFriends } = require("../follows");

const storedRelations = { }; // cache for relations
// userID: { relation, privacyCode, userID, otherUserID, msg, lastUpdated }


async function getUserRelation({ userID, otherUserID }) {
    if (!userID || !otherUserID) return { error: "Invalid parameters" };
    const cacheKey = `${userID}-${otherUserID}`;
    if (storedRelations[cacheKey]) {
        const cachedRelation = storedRelations[cacheKey];
        if (cachedRelation.lastUpdated > checktime() - (2*60*1000)) { // 2 minute cache
            return cachedRelation;
        }
    }

    const relationData = await getUserRelationSubFunc({ userID, otherUserID });
    relationData.lastUpdated = checktime();
    storedRelations[cacheKey] = relationData;
    return relationData;
}

async function getUserRelationSubFunc({ userID, otherUserID }) {

    // is user themself
    if (userID == otherUserID) return { relation: "Private", privacyCode: 4, userID, otherUserID, msg: "Relation is private level."}

    // is friends
    const userFriends = await areUserFriends({ userID, otherUserID });
    if (userFriends) return { relation: "Friends", privacyCode: 3, userID, otherUserID, msg: "Users are friends."}

    // is friend of friends
    const userFriendsOfFriends = await areUsersFriendsOfFriends({ userID, otherUserID });
    if (userFriendsOfFriends) return { relation: "Friends of friends", privacyCode: 2, userID, otherUserID, msg: "Users are friends of friends."}

    // is followed by user
    const userIsFollowing = await interactFollowSchema.findOne({ user: userID, following: otherUserID });
    if (userIsFollowing) return { relation: "Following", privacyCode: 5, userID, otherUserID, msg: "User is following other user."}

    // is following user
    const userIsFollowed = await interactFollowSchema.findOne({ user: otherUserID, following: userID });
    if (userIsFollowed) return { relation: "Followed", privacyCode: 6, userID, otherUserID, msg: "User is followed by other user."}

    // else 
    return { relation: "Public", privacyCode: 1, userID, otherUserID, msg: "Users have no relation."}
}

async function canView({ userID, otherUserID, privacyNum, userIDFollowOther }) {
    if (userID == otherUserID) return true;
    const userRelation = await getUserRelation({ userID, otherUserID });

    if (userRelation.blocked) return false;
    if (privacyNum == 1) return true;

    console.log("Checking privacy for user relation", userRelation, privacyNum, userIDFollowOther);
    if (privacyNum == userRelation.privacyCode) return true;

    // if (privacyNum == 2) {
    //     if (userRelation.privacyCode == 2) return true;
    //     else return false;
    // };

    // if (privacyNum == 3) {
    //     if (userRelation.privacyCode == 3) return true;
    //     else return false;
    // };
    
    // if (privacyNum == 4) {
    //     if (userRelation.privacyCode == 4) return true;
    //     else return false;
    // };

    // if (privacyNum == 5) {
    //     if (userRelation.privacyCode == 5) return true

    return false;
}

// async function getPrivacySettingRelation({ userID, userData, ownUserID, ownUserData, privacyName, })
module.exports = { getUserRelation, canView }