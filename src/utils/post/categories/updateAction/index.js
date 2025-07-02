const { removeCategoryData, categorizePost } = require("../");
const interactPostSchema = require("../../../../schemas/interactPostSchema");

// Categorize all posts in the database, this is used for initial categorization
async function categorizeAllPosts() {
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        await categorizePost({ postID: post._id, userID: post.userID });
    }
    return { done: true }
}

// Undo all categorization of posts, removing category data
async function undoAllCategorizePosts() {
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        await removeCategoryData({ postID: post._id });
    }
    return { done: true }
}

// rank user categories


module.exports = {categorizeAllPosts,undoAllCategorizePosts}