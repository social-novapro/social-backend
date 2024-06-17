const interactUserSchema = require("../../schemas/interactUserSchema")
const { searchErrorV2 } = require("../searchError")

async function searchUserTag({ username, userID }) {
    if (!userID) return searchErrorV2("U002", { userID: "Unknown" });
    if (!username) return searchErrorV2("U001", { userID });

    const users = await interactUserSchema.find()
    var possibleUsers = []

    for (const user of users) {
        if (user?.username?.startsWith(username)) {
            var possibility = username.length / user.username.length
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

module.exports = {searchUserTag};