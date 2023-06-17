const interactPostLikeSchema = require("../../../schemas/postSchemas/interactPostLikeSchema");

async function isLiked({ postID, userID }) {
    const postLiked = await interactPostLikeSchema.findOne({ 
        _id: postID, 
        "peopleLiked._id": userID 
    });

    if (postLiked != null) return true;
    else return false;
}

module.exports = {isLiked};