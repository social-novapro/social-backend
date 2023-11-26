const interactPostSchema = require("../../../schemas/interactPostSchema");
const { searchErrorV2 } = require("../../searchError");
const { getCoposts } = require("../coposter");

async function getPostsFromUser({ userID, coposts }) {
    const foundPosts = await interactPostSchema.find({ userID });
    if (coposts) {
        const foundCoposts = await getCoposts({userID});
        if (foundCoposts && !foundCoposts.error && foundCoposts.length > 0) foundPosts.push(...foundCoposts);
    }

    if (foundPosts && !foundPosts.length > 0) return searchErrorV2("D013", { userID }); 
    foundPosts.sort((a, b) => a.timePosted - b.timePosted);

    return foundPosts;
}

module.exports = { getPostsFromUser };