const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { isContentBookmarked } = require("../../bookmarks/bookmarkManagerV2");
const { findPoll, findUserVote } = require("../../polls");
const { getPrivacySetting } = require("../../privacy");
const { searchErrorV2 } = require("../../searchError");
const { checkIfPinned } = require("../../user/edit/checkIfPinned");
const { findFollow } = require("../../user/follows");
const { getUserRelation, canView, checkUserRelationForPrivacy } = require("../../user/relations");
const { postIsLiked } = require("../likeUtilV2/isPostLiked");
const { getPostTags } = require("../tags/getPostTags");

async function getPostWithData({ userID, postID, post, ownUser }) {
    if (!postID && !post) return searchErrorV2("Q003", { userID })
    var type = { "type": "post", "extra": "included" };
    var postData = post;
    var userData = null;
    var pollData = null;
    var voteData = null;
    var quoteData = {
        quotePost: null,
        quoteUser: null
    };
    var replyData = {
        replyPost: null,
        replyUser: null
    };
    var coposterData = null;
    var tagData = null;
    var extraData = {
        liked: false,
        pinned: false,
        saved: false,
        followed: false
    };
    
    if (!post) postData = await interactPostSchema.findOne({_id: postID });
    if (!postData) return searchErrorV2("Q003", { userID });
    if (postData.deleted) return searchErrorV2("D026", { userID });
    
    // check if user is following poster
    const userFollowing = await findFollow({ userID, followedUserID: postData.userID });
    if (userFollowing.found) extraData.followed = true;

    // privacy settings check
    const canViewPost = await checkUserRelationForPrivacy({
        userID,
        otherUserID: postData.userID,
        privacyName: "post",
        privacyOverride: postData.privacyOverride ? postData.privacyOverride : null
    });
    // console.log("Can view post:", canViewPost, "UserID:", userID, "PostID:", postID, "PostData:", postData);
    if (!canViewPost || canViewPost.error) return searchErrorV2("T013", { userID });

    if (postData.content) {
        /* if post is liked, add liked: true */
        const foundLike = await postIsLiked({ postID: postData._id, userID });
        if (foundLike) extraData.liked = true;
        /* if post is pinned to profile, add pinned: true */
        if (userID && !ownUser) {
            const personalUser = await interactUserSchema.findOne({_id: userID});
            extraData.pinned = await checkIfPinned({ pinsFound: personalUser?.pins || null, postID: postData._id });
        } else if (ownUser) {
            extraData.pinned = await checkIfPinned({ pinsFound: ownUser?.pins || null, postID: postData._id });
        } else {
            extraData.pinned = false;
        }
        /* if post is saved */
        if (userID) {
            const isBookmarked = await isContentBookmarked({ userID, UUID: postData._id, contentType: 0 });
            if (isBookmarked && !isBookmarked.error) extraData.saved = true;
        }

        /* if extra should be invoked */
        // has userid
        if (postData.userID) {
            const UserDataFound = await interactUserSchema.findOne({_id: postData.userID});
            if (UserDataFound) {
                userData = UserDataFound;
                type["user"] = "included";
            }
        }

        // has linked poll
        if (postData.pollID) {
            const foundPoll = await findPoll({ pollID: postData.pollID, userID });
            if (foundPoll && !foundPoll.error) {
                pollData = foundPoll;
                type["poll"] = "included";

                const foundVote = await findUserVote({ userID, pollID: postData.pollID});
                if (foundVote && !foundVote?.error && foundVote.voted) {
                    voteData = foundVote.foundVote;
                    type["vote"] = "included";
                }
            }
        }

        if (postData.replyingPostID || (postData.isReply && (postData.replyData && postData.replyData.postID && postData.replyData.userID))) {
            const replyID = postData.replyingPostID || postData.replyData.postID;
            const foundReply = await interactPostSchema.findOne({_id: replyID});
            
            if (foundReply) {
                replyData.replyPost = foundReply;
                type["reply"] = "included";

                if (foundReply.userID) {
                    const foundReplyUser = await interactUserSchema.findOne({_id: foundReply.userID});
                    if (foundReplyUser) {
                        replyData.replyUser = foundReplyUser;
                    }
                }
            }  
        }

        // has linked quote
        if (postData.quoteReplyPostID || (postData.quoteData && postData.quoteData.postID)) {
            const quoteID = postData.quoteReplyPostID || postData.quoteData.postID;
            const foundQuote = await interactPostSchema.findOne({_id: quoteID});
            
            if (foundQuote) {
                quoteData.quotePost = foundQuote;
                type["quote"] = "included";

                if (foundQuote.userID) {
                    const foundQuoteUser = await interactUserSchema.findOne({_id: foundQuote.userID});
                    if (foundQuoteUser) {
                        quoteData.quoteUser = foundQuoteUser;
                    }
                }
            }
        }

        // has coposters
        if (postData.coposters && postData.coposters.length > 0) {
            const foundCoposters = [];
            for (var i = 0; i < postData.coposters.length; i++) {
                const foundCoposter = await interactUserSchema.findOne({_id: postData.coposters[i]});
                if (foundCoposter) foundCoposters.push(foundCoposter);
            }

            if (foundCoposters.length > 0) {
                coposterData = foundCoposters;
                type["copost"] = "included";
            }
        }

        // has tags
        if (postData.hasTags) {
            const foundTags = await getPostTags({ postID: postData._id });

            if (foundTags && foundTags.length > 0) {
                tagData = foundTags;
                type["tag"] = "included";
            }
        }

        var dataSend = { 
            type, 
            postData,
            userData,
            pollData, 
            voteData,
            quoteData,
            replyData,
            coposterData,
            tagData,
            extraData
        };

        return dataSend;
    }

    return searchErrorV2("D025", { userID });
}

async function getPostBaiscData({ postID, postData }) {
    var type = { "type": "post" };
    var postData = post;
    var userData = null;
    var pollData = null;

    if (!post) postData = await interactPostSchema.findOne({_id: postID });

    if (post.content) {
        // has userid
        if (post.userID) {
            const UserDataFound = await interactUserSchema.findOne({_id: post.userID});
            if (UserDataFound) {
                userData = UserDataFound;
                type["user"] = "included";
            }
        }

        // has linked poll
        if (post.pollID) {
            const foundPoll = await findPoll({ pollID: post.pollID });
            if (foundPoll && !foundPoll.error) {
                pollData = foundPoll;
                type["poll"] = "included";
            }
        }

        var dataSend = { 
            type, 
            postData,
            userData,
            pollData, 
            voteData
        };

        return dataSend;
    }

    return null;
}

module.exports = { getPostWithData, getPostBaiscData }