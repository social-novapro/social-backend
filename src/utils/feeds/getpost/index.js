const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactUserSchema = require("../../../schemas/interactUserSchema");
const { findPoll, findUserVote } = require("../../polls");
const { isLiked } = require("../../post/isLiked");

async function getPostWithData({ userID, postID, post }) {
    var type = { "type": "post" };
    var postData = post;
    var userData = null;
    var pollData = null;
    var voteData = null;

    if (!post) postData = await interactPostSchema.findOne({_id: postID });

    if (post.content) {
        const foundLike = await isLiked({ postID: post._id, userID });
        if (foundLike) postData.liked = true;

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

                const foundVote = await findUserVote({ userID, pollID: post.pollID});
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

    return null;
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