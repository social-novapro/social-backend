const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { findPoll, findUserVote } = require("../../polls");
const { searchError } = require("../../searchError");
const { isLiked } = require("../isLiked");

async function getPostWithData({ userID, postID, post }) {
    if (!postID && !post) return searchError("Q003")
    var type = { "type": "post" };
    var postData = post;
    var userData = null;
    var pollData = null;
    var voteData = null;

    if (!post) postData = await interactPostSchema.findOne({_id: postID });
    if (!postData) return searchError("Q003")
    if (postData.content) {
        const foundLike = await isLiked({ postID: postData._id, userID });
        if (foundLike) postData.liked = true;

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
            const foundPoll = await findPoll({ pollID: postData.pollID });
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

        var dataSend = { 
            type, 
            postData,
            userData,
            pollData, 
            voteData
        };

        return dataSend;
    }

    return searchError("Z001");
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