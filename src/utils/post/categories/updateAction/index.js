const { removeCategoryData, categorizePost } = require("../");
const interactPostSchema = require("../../../../schemas/interactPostSchema");

async function categorizeAllPosts() {
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        await categorizePost({ postID: post._id, userID: post.userID });
    }
    return { done: true }
}

async function undoAllCategorizePosts() {
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        await removeCategoryData({ postID: post._id });
    }
    return { done: true }
}

module.exports = {categorizeAllPosts,undoAllCategorizePosts}