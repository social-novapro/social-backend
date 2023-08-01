const interactPostSchema = require("../../../schemas/interactPostSchema");
const { searchError } = require("../../searchError");

async function getPostsFromUser({ userID }) {
    const foundPosts = await interactPostSchema.find({ userID });
    if (foundPosts == null) return searchError("D013");
    else return foundPosts;
}

module.exports = { getPostsFromUser };