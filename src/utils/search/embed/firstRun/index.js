const { deleteEmbedPost, embedPost } = require("..");
const interactPostSchema = require("../../../../schemas/interactPostSchema");

async function updateAllPostEmbeddings() {
    const updates = [];
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        const update = await embedPost({postID: post._id, userID: post.userID, timestamp: post.timestamp, content: post.content});
        updates.push(update);
    }

    return { done: true, updates: updates };
}

async function undoAllPostEmbeddings() {
    const updates = [];
    const posts = await interactPostSchema.find();
    for (const post of posts) {
        const update = await deleteEmbedPost({postID: post._id});
        updates.push(update);
    }

    return { done: true, updates: updates };
}

module.exports = { updateAllPostEmbeddings, undoAllPostEmbeddings };