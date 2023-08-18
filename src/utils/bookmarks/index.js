const interactPostBookmarks = require('../../schemas/postSchemas/interactPostBookmarks')
const { searchErrorV2 } = require('../searchError');

/**
 * deletes all bookmarks from a user
 */
async function deleteAllBookmarks({ userID }) {
    const userBookmarks = await interactPostBookmarks.findOne({ _id: userID });
    if (!userBookmarks) return searchErrorV2("K004", { userID });

    await interactPostBookmarks.findOneAndDelete({ _id: userID });

    return userBookmarks;
}

/**
 * removes all bookmarks of a certian post, for example after deletion
 */
async function pullPostBookmarks({ postID, userID }) {
    const bookmarkData = await interactPostBookmarks.find({
        "saves._id" : postID,
    });

    if (!bookmarkData || !bookmarkData[0]) return searchErrorV2("K005", { userID })

    const pulledBookmarks = [];
    for (const bookmark of bookmarkData) {
        pulledBookmarks.push({ "userID": bookmark._id});
        
        // IN FUTURE COULD REPLACE WITH A "DELETED"
        await interactPostBookmarks.findOneAndUpdate({
            _id: bookmark._id
        }, {
            $pull : { "saves" : {_id: postID} }
        })
    }

    return pulledBookmarks;
}

module.exports = { deleteAllBookmarks, pullPostBookmarks }