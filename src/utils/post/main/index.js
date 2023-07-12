const interactPostSchema = require("../../../schemas/interactPostSchema");

async function getPostsFromUser({ userID }) {
    const foundPosts = await interactPostSchema.find({ userID });
    if (foundPosts == null) return { error: "No posts found" };
    else return foundPosts;
}

module.exports = { getPostsFromUser };