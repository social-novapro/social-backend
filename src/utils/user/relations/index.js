
async function getUserRelation({ userID, otherUserID }) {
    //const foundPrimaryUserFollows = await interactFollowSchema // .findOne({ user: userID, following: otherUserID });
    // TODO
    return { relation: "Friends", privacyCode: 3, userID, otherUserID, msg: "TODO"}
    //const foundRelationship = await interactRelationshipSchema.findOne({ $or: [{ user1: userID, user2: otherUserID }, { user1: otherUserID, user2: userID }] });
    //if (!foundRelationship) return { error: "No relationship found" };
    //return foundRelationship;
}
async function canView({ userID, otherUserID, privacyNum, userIDFollowOther }) {
    if (userID == otherUserID) return true;
    const userRelation = await getUserRelation({ userID, otherUserID });

    if (userRelation.blocked) return false;
    if (privacyNum == 1) return true;

    if (privacyNum == 2) {
        if (userRelation.privacyCode == 2) return true;
        else return false;
    };

    if (privacyNum == 3) {
        if (userRelation.privacyCode == 3) return true;
        else return false;
    };
    
    if (privacyNum == 4) {
        if (userRelation.privacyCode == 4) return true;
        else return false;
    };

    return false;
}

module.exports = { getUserRelation, canView }