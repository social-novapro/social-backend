const { searchHashTags } = require("./searchPostTags");
const { searchUserTag } = require("./searchUserTag");

async function searchTagText({userID, text}) {
    if (!text) return searchErrorV2("U006", { userID });
    
    if (text.startsWith("0")) {
        const found = await searchUserTag({ username: text.replace("0", ""), userID });
        return {
            users: found,
            found: true
        };
    } else if (text.startsWith("1")) {
        const found = await searchHashTags({ text: text.replace("1", "#"), userID });
        return {
            hashtags: found,
            found: true
        };
    }
}

module.exports = { searchTagText };