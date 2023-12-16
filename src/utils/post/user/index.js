const { getPostWithData } = require("../getPost");
const { getPostsFromUser } = require("../main");

async function getUserPosts({ userID, requesterID, coposts }) {
    const userPosts = []
    const foundPosts = await getPostsFromUser({ userID, coposts});
    if (foundPosts.error || !foundPosts) {
        return foundPosts
    };

    for (const post of foundPosts) {
        const data = await getPostWithData({ userID: requesterID, postID: post._id, post })
        if (data && !data.error) userPosts.push(data)
    }

    return userPosts;
}

module.exports = { getUserPosts }