
async function getUserRelation({ userID, otherUserID }) {
    //const foundPrimaryUserFollows = await interactFollowSchema // .findOne({ user: userID, following: otherUserID });
    // TODO
    return { relation: "Friends", privacyCode: 3, userID, otherUserID, msg: "TODO"}
    //const foundRelationship = await interactRelationshipSchema.findOne({ $or: [{ user1: userID, user2: otherUserID }, { user1: otherUserID, user2: userID }] });
    //if (!foundRelationship) return { error: "No relationship found" };
    //return foundRelationship;
}

module.exports = { getUserRelation }