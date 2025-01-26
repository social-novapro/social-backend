const { getPostWithData } = require("../getPost");
const { getPostsFromUserIndex } = require("../main");

async function getUserPosts({ userID, requesterID, coposts, indexID }) {
    const userPosts = []
    const foundUserPostIndex = await getPostsFromUserIndex({ userID, coposts, indexID });
    if (foundUserPostIndex.error || !foundUserPostIndex || !foundUserPostIndex.posts) {
        return foundUserPostIndex
    };

    for (const post of foundUserPostIndex.posts) {
        const data = await getPostWithData({ userID: requesterID, postID: post._id, post })
        if (data && !data.error) userPosts.push(data)
    }

    return {index: foundUserPostIndex, posts: userPosts};
}

module.exports = { getUserPosts }