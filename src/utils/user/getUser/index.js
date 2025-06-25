const interactUserSchema = require("../../../schemas/interactUserSchema");
const { getUserLikes } = require("../../post/likeUtilV2");
const { getUserMentions } = require("../../post/tags");
const { getUserPosts } = require("../../post/user");
const { validPrivacyOption } = require("../../privacy");
const { searchErrorV2 } = require("../../searchError");
const { getUserBadges } = require("../badges");
const { getUserPins } = require("../edit");
const { findFollow } = require("../follows");

async function getUser({userID, searchTerm}) {
    const foundViaUsername = await interactUserSchema.findOne({usernameLc: searchTerm.toLowerCase()});
    if (foundViaUsername) return foundViaUsername;

    const foundViaUserID = await interactUserSchema.findOne({_id: searchTerm});
    if (foundViaUserID) return foundViaUserID;

    return searchErrorV2("C009", { userID });
}

async function getAllUserData({userID, searchTerm }) {
    if (!userID) return searchErrorV2("B009", { userID })
    if (!searchTerm) return searchErrorV2("C021", { userID })

    const ownUser = await interactUserSchema.findOne({_id: userID});
    if (!ownUser) return searchErrorV2("C020", { userID })

    // user
    const userData = await getUser({userID, searchTerm});
    if (userData.error) return userData;

    // posts
    const postIndex = await getUserPosts({ 
        userID: userData._id, 
        requesterID: userID, 
        indexID: userData.postIndexID
    });

    // userPostIndex data
    const postIndexData = {
        indexID: postIndex.index._id ?? null,
        nextIndexID: postIndex.index.nextIndexID ?? null,
        prevIndexID: postIndex.index.prevIndexID ?? null,
        amount: postIndex.index.amount ?? 0
    }

    // badges
    const badgeData = await getUserBadges({ userID: userData._id});

    // pins
    const pinData = await getUserPins({ ownUser, userData });

    // mentions
    const mentionData = await getUserMentions({userID: userData._id})

    // follow
    const userFollowing = await findFollow({ userID: ownUser._id, followedUserID: userData._id });

    // TODO - likes (requires update)
    // const validatedLikePrivacy = validPrivacyOption({ userID })
    const likesData = await getUserLikes({ userID: userData._id, ownUserID: ownUser._id, ownUserData: ownUser });
    const hasLikeData = likesData && !likesData.error && likesData.likes && likesData.likes.length > 0;

    // get relation
    const sendBack = {
        included: {
            user: "true",
            posts: `${postIndex ? true : false}`,
            pins: pinData.length > 0 ? true : false,
            badges: badgeData.length > 0 ? true : false,
            mentions: mentionData.length > 0 ? true : false,
            userPostIndexData: postIndex ? true : false,
            likes: hasLikeData,
            extraData: true
        },
        userData: userData,
        postData: postIndex.posts,
        userPostIndexData: postIndexData,
        pinData: pinData,
        badgeData: badgeData,
        mentionData: mentionData,
        likesData: hasLikeData ? likesData : null,
        extraData: {
            followed: userFollowing.found ? true : false,
        }
    }

    console.log("Sending back user data:", likesData);

    return sendBack;
}

async function getBasicUserData({userID, searchTerm}) {
    if (!userID) return searchErrorV2("B009", { userID })
    if (!searchTerm) return searchErrorV2("C021", { userID })

    // user
    const userData = await getUser({userID, searchTerm});
    if (userData.error) return userData;

    const userFollowing = await findFollow({ userID, followedUserID: userData._id });
    
    var userDataExtra = {...userData._doc, followed: false};
    userDataExtra.followed = userFollowing.found ? true : false;

    return userDataExtra;
}

module.exports = {
    getAllUserData, 
    getBasicUserData
}
