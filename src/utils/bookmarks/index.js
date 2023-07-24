const interactPostBookmarks = require('../../schemas/postSchemas/interactPostBookmarks')
const { searchError } = require('../searchError');

/**
 * deletes all bookmarks from a user
 */
async function deleteAllBookmarks({ userID }) {
    const userBookmarks = await interactPostBookmarks.findOne({ _id: userID });
    if (!userBookmarks) return searchError("K004");

    await interactPostBookmarks.findOneAndDelete({ _id: userID });

    return userBookmarks;
}

module.exports = { deleteAllBookmarks }