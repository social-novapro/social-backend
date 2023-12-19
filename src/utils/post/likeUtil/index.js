const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const interactPostLikeSchema = require("../../../schemas/postSchemas/interactPostLikeSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { sendPushAppleNotification } = require("../../pushNotifications/apnProvider");

async function postIsLiked({ postID, userID }) {
    const postLiked = await interactPostLikeSchema.findOne({ 
        _id: postID, 
        "peopleLiked._id": userID 
    });

    if (postLiked != null) return true;
    else return false;
}

async function unlikePost({postID, userID}) {
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound) return searchErrorV2("K002", { userID: userID});
    
    const foundLiked = await postIsLiked({ postID, userID });
    if (!foundLiked) return searchErrorV2("D014", { userID: userID });

    await interactPostLikeSchema.findOneAndUpdate(
        { _id: postID }, 
        { $pull : { "peopleLiked" : { _id: userID } } },
        { upsert: true }
    )

    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes - 1;

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
    return postFoundNew;
}

async function likePost({ postID, userID }) {
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound) return searchErrorV2("D015", { userID: userID});

    const foundLiked = await postIsLiked({ postID, userID });
    if (foundLiked) return searchErrorV2("D010", { userID: userID });
    const foundUser = await interactUserSchema.findOne({ _id: userID});

    await interactPostLikeSchema.findOneAndUpdate(
        { _id: postID }, 
        { $push : { "peopleLiked" : { _id: userID, timeStamp: checktime() } } },
        { upsert: true }
    )

    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes + 1;

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
   
    // push notification
    const subtitle = `@${foundUser.username} liked your post!`

    sendPushAppleNotification({ 
        userID: postFoundNew.userID, 
        type: "likes",
        notification: { title: "Interact Like", subtitle, body: postFoundNew.content }
    })

    return postFoundNew;
}

async function getLikes({ postID }) {
    const foundPost = await interactPostLikeSchema.findOne({ _id: postID});

    var returnData = {
        postID,
        peopleLiked: []
    };

    if (!foundPost) return searchErrorV2("D005", { userID: "unknown" });

    for (const people of foundPost.peopleLiked) {
        const user = await interactUserSchema.findOne({_id: people._id});
        if (user) {
            returnData.peopleLiked.push({
                userID: people._id,
                username: user.username
            });
        };
    };

    return returnData;
}

module.exports = {
    unlikePost,
    postIsLiked,
    likePost,
    getLikes
};
