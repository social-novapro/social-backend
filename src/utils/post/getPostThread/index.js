const { getPostReplies } = require("..");
const { getPostWithData } = require("../getPost");

async function getPostThread({ userID, postID }) {
    // get newer replies max 5
    // get older replies max 10
    const mainPost = await getPostWithData({ userID, postID });
    if (mainPost.error) return mainPost;

    const response = {
        post: mainPost,
        repliesThreaded: [],
        repliesToPost: [],
        parentPosts: [],
    }

    if (mainPost.postData.totalReplies > 0) {
        var keepGoing = true;
        var foundRepliesThreaded = 0;
        var foundRepliesMain = 0;
        var nextPostID = postID;
        
        while (keepGoing && foundRepliesThreaded <= 5) {
            const replies = await getPostReplies({ userID, postID: nextPostID });
            if (replies.error) {
                keepGoing = false;
            } else {
                // there are replies
                if (replies.replyIndex.postIDs.length > 0) {
                    // if nextPostID is the main post
                    var foundNextReplyData = null;
                    if (nextPostID === postID) {
                        for (const replyID of replies.replyIndex.postIDs) {
                            // better with replies is already postdata, but missing user data/poll data
                            const currentReply = await getPostWithData({ userID, postID: replyID });

                            if (currentReply.error) {
                                break;
                            }
                            if (replyID == replies.replyIndex.postIDs[replies.replyIndex.postIDs.length-1]) {
                                foundNextReplyData = currentReply;
                            }

                            response.repliesToPost.push(currentReply);
                            foundRepliesMain++;
                            // if we found 5 replies, stop this loop
                            if (foundRepliesMain >= 5) {
                                break;
                            }
                        }
                    }
                    
                    // -1 is newest post 
                    nextPostID = replies.replyIndex.postIDs[replies.replyIndex.postIDs.length - 1];
                    if (foundNextReplyData) {
                        response.repliesThreaded.push(foundNextReplyData);
                        foundRepliesThreaded++;
                    } else {
                        const foundReply = await getPostWithData({ userID, postID: nextPostID });
                        if (foundReply.error) {
                            keepGoing = false;
                        } else {
                            response.repliesThreaded.push(foundReply);
                            foundRepliesThreaded++;
                        }
                    }
                } else {
                    keepGoing = false;
                }
            }
        }
    }

    if (mainPost.postData.isReply) {
        var keepGoing = true;
        var foundParents = 0;
        var parentPostID = mainPost.postData.replyData.postID;

        while (keepGoing && foundParents <= 5) {
            // there may be a better way; with mainPost.replyPost/.replyUser, but missing poll data
            const parentPost = await getPostWithData({ userID, postID: parentPostID });
            if (parentPost.error) {
                keepGoing = false;
            } else {
                response.parentPosts.push(parentPost);
                foundParents++;

                if (parentPost.postData.isReply) {
                    parentPostID = parentPost.postData.replyData.postID;
                } else {
                    keepGoing = false;
                }
            }
        }
    }

    return response;
}

module.exports = {
    getPostThread,
};