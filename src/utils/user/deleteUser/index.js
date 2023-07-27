const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const interactDeletedSchema = require('../../../schemas/deleted/interactDeletedSchema');
const interactEmailVerificationSchema = require("../../../schemas/emails/interactEmailVerificationSchema");
/* poll functinos */
const { deletePoll, getPollsFromUser, deleteUserVotes } = require('../../polls/');
/* post functions */
const { getPostsFromUser } = require('../../post/main/');
const { removePost, removeUserLikes } = require('../../post/removePost/');
const { v4: uuidv4 } = require('uuid');
const { deleteDevAcc, deleteUserAccesses } = require('../../developer/delete');
const { deleteAllBookmarks } = require('../../bookmarks');
const { deleteEmailDBs } = require('../../email/setEmail');
const { unsubFromAll } = require('../../subscriptions');
const { searchError } = require('../../searchError');
const { checktime, timeSinceEpoch } = require('../../checktime');
const { emailSender } = require('../../email/send');
const { current } = require("../../../../config.json");
const { checkPassword } = require('../../userAuth');
const interactDeletedUserSchema = require('../../../schemas/deleted/interactDeletedUserSchema');

/**
 * user requests to delete, makes an email
 */
async function requestDelete({ userID, password }) {
    if (!password) return searchError("Z002", [{ name: "msg", data: "no passsword provided"}] );
    
    const passwordCorrect = await checkPassword({ userID: userID, password: password });
    if (!passwordCorrect || passwordCorrect.error) return searchError("G005");

    const foundVer = await interactEmailVerificationSchema.findOne({ userID });
    if (!foundVer) return searchError("P001");
    if (!foundVer.verified) return searchError("P002");

    var delAccVerID = uuidv4();
    await interactEmailVerificationSchema.findOneAndUpdate({ 
        _id: foundVer._id
    }, {
        shouldDelAcc: true,
        deleteAccountVerID: delAccVerID,
        timestampDeleteAccount: checktime()
    });

    await sendDeletionEmail({ email: foundVer.email, userID: foundVer.userID, delAccVerID});
    
    return { success: true };
}

async function sendDeletionEmail({ email, userID, delAccVerID}) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?deleteAccount=${delAccVerID}/`;
    
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 2,
        subject: "Confirm Deletion",
        content: `Thank you for checking out Interact, to delete your account open: ${verURL} and confirm your deletion!`,
        htmlElement: {
            h1: "Account Deletion",
            p: "Thank you for checking out Interact, to delete your account open the link, and confirm your deletion!",
            a: `${verURL}`,
        }
    });
    return true;
}

/**
 * sends email to user with completion confirmation
 */
async function sendCompletionEmail({ email, username, userID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const sendURL = `${mainURL}/`
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            username,
            bbc: false
        }],
        type: 2,
        subject: "Deletion Completed",
        content: `Thank you for checking out Interact, your account has been deleted! You can make another account, or in the future recover your account (feature not complete yet). Check out interact again via link: ${sendURL}`,
        htmlElement: {
            h1: "Account has been deleted.",
            p: "Thank you for checking out Interact, your account has been deleted! You can make another account, or in the future recover your account (feature not complete yet). Check out interact again via link below.",
            a: `${sendURL}`,
        }
    });
    return true;
}

/**
 * lets user cancel the delete request, and cant run delete link
 */
async function cancelDelete({ deleteID }) {
    const foundVer = await interactEmailVerificationSchema.findOne({ deleteAccountVerID: deleteID });
    if (!foundVer) return searchError("P004");

    if (!foundVer.verified) return searchError("P002");

    if (!foundVer.deleteAccountVerID || !foundVer.shouldDelAcc) return searchError("P003");

    await interactEmailVerificationSchema.findOneAndUpdate({ 
        _id: foundVer._id 
    }, {
        shouldDelAcc: false,
        deleteAccountVerID: null,
        timestampDeleteAccount: null
    });
    
    return true;
}

/**
 * confirms delete request, deletes all data
 */
async function confirmDelete({ deleteID }) {
    const foundVer = await interactEmailVerificationSchema.findOne({ deleteAccountVerID: deleteID });
    if (!foundVer) return searchError("P004");

    const checkExpired = checkIfRequestExpired(foundVer.timestampDeleteAccount);
    if (checkExpired.error) return checkExpired;

    // NOT DONE
    // AFTER TEST:
    const deleted = await deleteUser({ userID: foundVer.userID });
    return deleted;
}

/**
 * checks if the request is expired
 * max is 1 day 
 */
function checkIfRequestExpired(timestamp) {
    //const defaultExpire = 8640;
    //const defaultExpire = 86400000; // 1 day
    const defaultExpire =  1800000; // 30 minutes
    
    const diff = checktime() - timestamp;

    if (diff>=defaultExpire) return searchError("P005", [{ name: "time", data: timeSinceEpoch((diff-defaultExpire))}]);
    else return true;
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
    
    const delDevSettings = await deleteDev({ userID });
    
    const delEmails = await deleteEmails({ userID });

    const delPrivUser = await deletePrivateUser({ userID });

    const delPolls = await deletePolls({ userID });

    const delVotes = await removeUserVotes({ userID });

    const delBookmarks = await deleteBookmarks({ userID });

    const delSubs = await deleteSubscriptions({ userID });

    const delUserAccesssTokens = await deleteAccessTokens({ userID });

    const deleteData = {
        success: true,
        deletedDB,
        delPublicUser,
        postData: {
            deletedPosts,
            delRemovedLikes
        },
        privateData: {
            delUserAccesssTokens,
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

    const newID = uuidv4();

    const save = await interactDeletedUserSchema.create({
        _id: newID,
        allData: deleteData
    });

    // sends email to user with completion confirmation
    await sendCompletionEmail({ email, username, userID });

    return {
        newID,
        deleteData
    };
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
   const deletedAcceses = await deleteUserAccesses({ userID });
   return deletedAcceses;
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
    if (!foundPosts || foundPosts.error) return { error: "user has no posts" };
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

module.exports = { requestDelete, confirmDelete, cancelDelete, demoDelete }