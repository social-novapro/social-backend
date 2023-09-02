const interactPostSchema = require("../../../schemas/interactPostSchema");
const { searchErrorV2 } = require("../../searchError");

async function getPostsFromUser({ userID }) {
    const foundPosts = await interactPostSchema.find({ userID });
    if (foundPosts == null) return searchErrorV2("D013", { userID });
    else return foundPosts;
}

module.exports = { getPostsFromUser };