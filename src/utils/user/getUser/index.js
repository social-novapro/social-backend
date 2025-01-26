const interactUserSchema = require("../../../schemas/interactUserSchema");
const { getUserMentions } = require("../../post/tags");
const { getUserPosts } = require("../../post/user");
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
    const postIndex= await getUserPosts({ 
        userID: userData._id, 
        requesterID: userID, 
        coposts: true,
        indexID: userData.postIndexID
    });

    const postIndexData = {
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
    const sendBack = {
        included: {
            user: "true",
            posts: `${postIndex ? true : false}`,
            pins: pinData.length > 0 ? true : false,
            badges: badgeData.length > 0 ? true : false,
            mentions: mentionData.length > 0 ? true : false,
            userPostIndexData: postIndex ? true : false,
            extraData: true
        },
        userData: userData,
        postData: postIndex.posts,
        userPostIndexData: postIndexData,
        pinData: pinData,
        badgeData: badgeData,
        mentionData: mentionData,
        extraData: {
            followed: userFollowing.found ? true : false,
        }
    }

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
