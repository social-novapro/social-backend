const interactUserSchema = require("../../schemas/interactUserSchema");
const { getPrivacySetting } = require("../privacy");
const { searchErrorV2 } = require("../searchError");
const { findFollow } = require("../user/follows/findFollow");
const { getUserRelation } = require("../user/relations");

async function searchUserTag({ username, userID }) {
    if (!userID) return searchErrorV2("U002", { userID: "Unknown" });
    if (!username) return searchErrorV2("U001", { userID });

    const searchUsernameLc = username.toLowerCase();
    const users = await interactUserSchema.find()
    var possibleUsers = []

    for (const user of users) {
        if (user?.usernameLc?.startsWith(searchUsernameLc)) {
            var possibility = searchUsernameLc.length / user.username.length
            var pushUser = {
                possibility: possibility.toFixed(3),
                user
            }

            possibleUsers.push(pushUser)
        }
    }

    if (!possibleUsers) return searchErrorV2("U005", { userID })
    possibleUsers.sort((firstItem, secondItem) => firstItem.possibility - secondItem.possibility);
    possibleUsers.reverse()

    return possibleUsers;
}

/* lookup users for userID, username, and displayname */
async function lookupUsers({ userID, lookUpKey, lookUpKeyLower, UserData }) {
    if (lookUpKey == "@") return [];
    var usersFound = [];

    for (user of UserData) {
        var username = user.usernameLc?.toLowerCase();
        var displayname = user.displayName?.toLowerCase();

        const userPrivacy = await getPrivacySetting({ userID: user._id, privacy: "profile" });
        if (userPrivacy == 4 && user._id != userID) continue;
    
        if (userPrivacy == 3) { 
            const userRelation = await getUserRelation({ userID, otherUserID: userID });
            if (userRelation.privacyCode != 3 || userRelation.privacyCode != 4 ) continue;
        }

        const tempKey = lookUpKeyLower.startsWith("@") ? lookUpKeyLower.replace('@', '') : lookUpKeyLower;
        const userFollowing = await findFollow({ userID, followedUserID: user._id });

        var userData = {...user._doc, followed: false};
        userData.followed = userFollowing.found ? true : false;

        if (lookUpKey == user._id) usersFound.push(userData);
        else if (username.startsWith(tempKey) || displayname.startsWith(tempKey)) usersFound.push(userData);
    };

    return usersFound;
}

module.exports = {searchUserTag, lookupUsers};