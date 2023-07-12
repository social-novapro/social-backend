/* poll functinos */
const { deletePoll, getPollsFromUser } = require('../../polls/');
/* post functions */
const { getPostsFromUser } = require('../../post/main/');
const { removePost } = require('../../post/removePost/');
const interactUserSchema = require('../../../schemas/interactUserSchema');
/**
 * user requests to delete, makes an email
 */
async function requestDelete({ userID }) {

}

/**
 * confirms delete request, deletes all data
 */
async function confirmDelete({ deleteID }) {

}
/**
 * confirms delete request, deletes all data
 */
async function deleteDemo({ username }) {
    const user = await interactUserSchema.findOne({ username });
    if (!user) return { error: 'user not found' };
    if (user.demo != true) return { error: 'user is not a demo' };
    
    await deleteUser({ userID: user._id });
}

/**
 * delete user
 */

async function deleteUser({ userID }) {
    await deletePosts({ userID });
 
    return { success: true };
}

/**
 * deletes all public data and chains other public deletes
 */
async function deletePublicUser({ userID }) {

}

/**
 * deletes all posts from user
 */
async function deletePosts({ userID }) {
    const foundPosts = await getPostsFromUser({ userID });

    for (const post of foundPosts) {
        await removePost(post);
    }
}

/**
 * deletes any other data associated with post
 */
async function deletePostSubData({ postID }) {

}

/**
 * deletes all polls created by user 
 */
async function deletePolls({ userID }) {
    const foundPolls = getPollsFromUser({ userID });
    if (foundPolls.error) return foundPolls;
    
    for (const poll of foundPolls) {
        await deletePoll({ userID, pollID: poll._id })
    }
}

/**
 * deletes any other data associated with poll
 */
async function deletePollSubData({ pollID }) {
}

/**
 * deletes all likes from user
 */
async function deleteLikes({ userID }) {
}
/**
 * deletes subscriptions from user
 * people subbed to them, and people they are subbed to
 */
async function deleteSubscriptions({ userID }) {

}

/**
 * deletes priv schema, and chains other private deletes
 */
async function deletePrivateUser({ userID }) {

}
/**
 * delete all email data
 */
async function deleteEmails({ userID }) {

}

/**
 * delete developer data
 */
async function deleteDevProfile({ userID }) {


}

module.exports = { requestDelete, confirmDelete, deleteDemo }