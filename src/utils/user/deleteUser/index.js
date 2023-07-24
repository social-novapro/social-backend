/* poll functinos */
const { deletePoll, getPollsFromUser, deleteUserVotes } = require('../../polls/');
/* post functions */
const { getPostsFromUser } = require('../../post/main/');
const { removePost, removeUserLikes } = require('../../post/removePost/');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactDeletedSchema = require('../../../schemas/interactDeletedSchema');
const { v4: uuidv4 } = require('uuid');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { getAccessTokens, deleteDevAcc } = require('../../developer/delete');
const { deleteAllBookmarks } = require('../../bookmarks');
const { deleteEmailDBs } = require('../../email/setEmail');
const { unsubFromAll } = require('../../subscriptions');

/**
 * user requests to delete, makes an email
 */
async function requestDelete({ userID }) {

}

/**
 * lets user cancel the delete request, and cant run delete link
 */
async function cancelDelete({ deleteID }) {

}

/**
 * confirms delete request, deletes all data
 */
async function confirmDelete({ deleteID }) {

}

/**
 * confirms delete request, deletes all data
 */
async function demoDelete({ username }) {
    const user = await interactUserSchema.findOne({ username });
    if (!user) return { error: 'user not found' };
    if (user.demo != true) return { error: 'user is not a demo' };
    
    const deletedUser = await deleteUser({ userID: user._id, username: user.username });

    return deletedUser;
}

/**
 * delete user
 * runs other functions in file to delete each section
 */
async function deleteUser({ userID, username }) {
    const deletedID = uuidv4();
    const deletedDB = await interactDeletedSchema.create({
        _id: deletedID,
        type: 1,
        userID,
        username
    });

    const deletedPosts = await deletePosts({ userID, username });
    
    const delPublicUser = await deletePublicUser({ userID });

    const delRemovedLikes = await deleteLikes({ userID });
    
    const delAccesssTokens = await deleteAccessTokens({ userID });
    
    const delDevSettings = await deleteDev({ userID });
    
    const delEmails = await deleteEmails({ userID });

    const delPrivUser = await deletePrivateUser({ userID });

    const delPolls = await deletePolls({ userID });

    const delVotes = await removeUserVotes({ userID });

    const delBookmarks = await deleteBookmarks({ userID });

    const delSubs = await deleteSubscriptions({ userID });

    return {
        success: true,
        deletedDB,
        delPublicUser,
        postData: {
            deletedPosts,
            delRemovedLikes
        },
        privateData: {
            delAccesssTokens,
            delDevSettings,
            delPrivUser,
        },
        emailData: {
            delEmails
        },
        pollData: {
            delVotes,
            delPolls
        },
        saves: {
            delSubs,
            delBookmarks
        }
    }
}

/**
 * deletes all public data and chains other public deletes
 */
async function deletePublicUser({ userID }) {
    const foundUser = await interactUserSchema.findOne({ _id: userID });
    if (!foundUser) return { error: "not found " };

    const deletedUser = await interactUserSchema.findOneAndDelete({ _id: userID })

    return {
        foundUser, deletedUser
    }
}

/**
 * deletes priv schema, and chains other private deletes
 */
async function deletePrivateUser({ userID }) {
    const foundPriv = await interactUserPrivSchema.findOneAndDelete({ _id: userID });
    return foundPriv;
}

/**
 * delete tokens
 */
async function deleteAccessTokens({ userID }) {
    const accessesFound = await getAccessTokens({ userID });
    if (!accessesFound) return null;
    const deletedAccesses = [];

    for (const access of accessesFound) {
        const deletedAccess = await deleteAccessTokens({ accessToken: access._id })
        deletedAccesses.push(deletedAccess);
    }

    return deletedAccesses;
}

/**
 * delete dev account tokens
 * access and dev token
 */
async function deleteDev({ userID }) {
    const delData = await deleteDevAcc({ userID })
    return delData;
}

/**
 * deletes all posts from user
 */
async function deletePosts({ userID }) {
    const foundPosts = await getPostsFromUser({ userID });
    if (!foundPosts || foundPosts.error) return null;
    const data = [];

    for (const post of foundPosts) {
        data.push(post);
        await removePost(post);
    }

    return data;
}

/**
 * deletes any other data associated with post
 * canceled: moved to inside removePost
 */

/**
 * remove user likes
 */
async function deleteLikes({ userID }) {
    const removed = await removeUserLikes({ userID });
    return removed;
}
/**
 * deletes all polls created by user 
 */
async function deletePolls({ userID }) {
    const foundPolls = await getPollsFromUser({ userID });
    if (foundPolls.error) return foundPolls;
    const delArr = [];

    for (const poll of foundPolls) {
        const delPoll = await deletePoll({ userID, pollID: poll._id });
        delArr.push(delPoll);
    }

    return delArr;
}

/**
 * deletes any other data associated with poll
 * canceled: should be handled by deletePoll function
 */

/**
 * deletes user votes from other polls
 */
async function removeUserVotes({ userID }) {
    const deletedVotes = await deleteUserVotes({ userID });

    return deletedVotes;
}

/**
 * deletes subscriptions from user
 * people subbed to them, and people they are subbed to
 */
async function deleteSubscriptions({ userID }) {
    const delSubs = unsubFromAll({ userID });
    return delSubs;
}

/**
 * delete bookmarks
 */
async function deleteBookmarks({ userID }) {
    const deleted = await deleteAllBookmarks({ userID });
    return deleted;
}

/**
 * delete all email data
 */
async function deleteEmails({ userID }) {
   const delEmails = await deleteEmailDBs({ userID });
   return delEmails;
}

module.exports = { requestDelete, confirmDelete, demoDelete }