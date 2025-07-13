const interactFollowSchema = require("../../../schemas/user/interactFollowSchema");
const { checktime } = require("../../checktime");
const { getPrivacySetting } = require("../../privacy");
const { areUserFriends, areUsersFriendsOfFriends, findFollow } = require("../follows");

const storedRelations = { }; // cache for relations
// userID: { relation, privacyCode, userID, otherUserID, msg, lastUpdated }

async function getUserRelation({ userID, otherUserID }) {
    if (!userID || !otherUserID) return { error: "Invalid parameters" };
    const cacheKey = `${userID}-${otherUserID}`;
    if (storedRelations[cacheKey]) {
        const cachedRelation = storedRelations[cacheKey];
        if (cachedRelation.lastUpdated > checktime() - (60000)) { // 1 minute cache
            return cachedRelation;
        }
        // } else console.log("Cache expired for relation:", cacheKey);
    }

    const relationData = await getUserRelationSubFunc({ userID, otherUserID });
    relationData.lastUpdated = checktime();
    storedRelations[cacheKey] = relationData;
    return relationData;
}

// userID = user requesting relation
// otherUserID = user to check relation with
async function getUserRelationSubFunc({ userID, otherUserID }) {
    const foundRelations = new Set([]);;

    // User requesting is: following user
    const userIsFollowing = await findFollow({userID, followedUserID: otherUserID})//.findOne({ userID, followedUserID: otherUserID, current: true });
    if (userIsFollowing.found) foundRelations.add(6); //return { relation: "Following", privacyCode: 5, userID, otherUserID, msg: "User is following other user."}
    
    // User requesting is: followed by user
    const userIsFollowed = await findFollow({ userID: otherUserID, followedUserID: userID });
    if (userIsFollowed.found) foundRelations.add(5); //return { relation: "Followed", privacyCode: 6, userID, otherUserID, msg: "User is followed by other user."}

    // is user themself
    if (userID == otherUserID) foundRelations.add(4); //return { relation: "Private", privacyCode: 4, userID, otherUserID, msg: "Relation is private level."}

    // is friends
    const userFriends = await areUserFriends({ userID, otherUserID });
    if (userFriends) foundRelations.add(3); //return { relation: "Friends", privacyCode: 3, userID, otherUserID, msg: "Users are friends."}

    // is friend of friends
    const userFriendsOfFriends = await areUsersFriendsOfFriends({ userID, otherUserID });
    // console.log("User Friends of Friends:", userFriendsOfFriends);
    if (userFriendsOfFriends.found) foundRelations.add(2); // return { relation: "Friends of friends", privacyCode: 2, userID, otherUserID, msg: "Users are friends of friends."}

    foundRelations.add(1); //return { relation: "Public", privacyCode: 1, userID, otherUserID, msg: "Users have no relation."}
    return {relations: foundRelations};
}

async function checkUserRelationForPrivacy({ userID, otherUserID, privacyName, privacyOverride }) {
    if (!userID || !otherUserID || !privacyName) return false;
    
    if (userID == otherUserID) return true;

    const userRelation = await getUserRelation({ userID, otherUserID });
    if (userRelation.error) return userRelation;
    if (userRelation.blocked) return false;

    const foundPrivacy = await getPrivacySetting({ userID: otherUserID, privacy: privacyName });
    if (foundPrivacy.error) return false;

    const privacyNum = privacyOverride ? privacyOverride : foundPrivacy;
    
    if (privacyNum == 4 && userID != otherUserID) return false; // Private level, only user can see
    if (privacyNum == 1) return true;

    if (userRelation.relations.has(privacyNum)) return true;
    return false;
}

module.exports = { getUserRelation, checkUserRelationForPrivacy }