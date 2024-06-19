const interactUserSchema = require("../../schemas/interactUserSchema");
const { getPrivacySetting } = require("../privacy");
const { searchErrorV2 } = require("../searchError");
const { getUserRelation } = require("../user/relations");

async function searchUserTag({ username, userID }) {
    if (!userID) return searchErrorV2("U002", { userID: "Unknown" });
    if (!username) return searchErrorV2("U001", { userID });

    const searchUsernameLc = username.toLowerCase();
    const users = await interactUserSchema.find()
    var possibleUsers = []

    for (const user of users) {
        if (user?.username?.startsWith(searchUsernameLc)) {
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
        var username = user.username?.toLowerCase();
        var displayname = user.displayName?.toLowerCase();

        const userPrivacy = await getPrivacySetting({ userID: user._id, privacy: "profile" });
        if (userPrivacy == 4 && user._id != userID) continue;

        if (userPrivacy == 3) { 
            const userRelation = await getUserRelation({ userID, otherUserID: userID });
            if (userRelation.privacyCode != 3 || userRelation.privacyCode != 4 ) continue;
        }

        const tempKey = lookUpKeyLower.startsWith("@") ? lookUpKeyLower.replace('@', '') : lookUpKeyLower;
    
        if (lookUpKey == user._id) usersFound.push(user);
        else if (username.startsWith(tempKey) || displayname.startsWith(tempKey)) usersFound.push(user);
    };

    return usersFound;
}

module.exports = {searchUserTag, lookupUsers};