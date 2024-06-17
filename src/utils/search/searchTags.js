const { searchHashTags } = require("./searchPostTags");
const { searchUserTag } = require("./searchUserTag");

async function searchTagText({userID, text}) {
    if (!text) return searchErrorV2("U006", { userID });
    
    if (text.startsWith("@")) {
        const found = await searchUserTag({ username: text, userID });
        return found;
    } else if (text.startsWith("#")) {
        const found = await searchHashTags({ text, userID });
        return found;
    }
}

module.exports = { searchTagText };