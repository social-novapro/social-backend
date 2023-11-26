const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostCoSchema = require("../../../schemas/postSchemas/interactPostCoSchema");
const { searchErrorV2 } = require("../../searchError");

async function getPostsFromUser({ userID }) {
    const foundPosts = await interactPostSchema.find({ userID });
    const foundCoposter = await interactPostCoSchema.find({ userID });
    foundPosts.push(...foundCoposter);
    console.log(foundPosts)

    if (foundPosts && foundPosts.length > 0) return searchErrorV2("D013", { userID }); 
    foundPosts.sort((a, b) => {
        if (a.timestamp < b.timestamp) return 1;
        else if (a.timestamp > b.timestamp) return -1;
        else return 0;
    });

    return foundPosts;
}

module.exports = { getPostsFromUser };