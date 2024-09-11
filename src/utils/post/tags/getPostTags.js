const interactPostTagSchema = require("../../../schemas/posts/interactPostTagSchema");

async function getPostTags({ postID }) {
    const postTags = await interactPostTagSchema.find({postID});
    return postTags;
}

module.exports = { getPostTags };