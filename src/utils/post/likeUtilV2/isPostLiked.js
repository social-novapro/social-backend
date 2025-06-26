const interactPostLike = require("../../../schemas/postSchemas/interactPostLike");

// Check if post is liked by user
async function postIsLiked({ postID, userID }) {
    const postLiked = await interactPostLike.findOne({
        postID: postID,
        userID: userID,
        active: true
    });

    if (postLiked != null) return postLiked;
    else return false;
}

module.exports = { postIsLiked };