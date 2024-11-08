const interactFollowSchema = require("../../../schemas/user/interactFollowSchema");

// find if user is following another user
async function findFollow({ userID, followedUserID, followID }) {
    var foundFollowing = null;
    if (followID) {
        foundFollowing = await interactFollowSchema.findOne({ _id: followID });
    } else {
        foundFollowing = await interactFollowSchema.findOne({
            current: true,
            userID,
            followedUserID
        });
    }
    
    if (!foundFollowing) return { found: false };
    return {
        found: true,
        followData: foundFollowing
    };
}

module.exports = {findFollow};