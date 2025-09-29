const interactBookmark = require("../../schemas/bookmarks/interactBookmark");
const interactBookmarkList = require("../../schemas/bookmarks/interactBookmarkList");
const { findContentType } = require("../general/findContentType");

/**
 * is content bookmarked?
 * 
 * if contentType not provided, will try to find it -- unless bookmarkID provided
 * 
 * must provide userID and UUID
 * can provide: bookmarkID, listID, or listname
 * 
 * returns null if not bookmarked
 * returns bookmark object if bookmarked
 * returns { error: true, msg } if error
 * 
 * bookmark doesnt exist: if (!result || result.error)
 * bookmarked: if (result && !result.error)
 */
async function isContentBookmarked({ userID, UUID, contentType, listID=null, listname=null, bookmarkID=null }) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!UUID && !bookmarkID) return { error: true, msg: "No UUID nor bookmarkID provided" };

    if (!contentType && !bookmarkID) {
        // find content
        const contentTypeFound = await findContentType(UUID);
        if (contentTypeFound<0) return //{ error: true, msg: "content not found" };
        contentType = contentTypeFound;
    }

    var bookmarkFound;
    if (bookmarkID) {
        bookmarkFound = await interactBookmark.findOne({ _id: bookmarkID, active: 1 });
    } else if (listID) {
        bookmarkFound = await interactBookmark.findOne({ userID, contentUUID: UUID, listID, active: 1 });
    } else if (listname) {
        const foundList = await interactBookmarkList.findOne({ userID, listname });
        console.log("found list by name?", foundList);
        if (!foundList) return { error: true, msg: "no list found with that name"}
        bookmarkFound = await interactBookmark.findOne({ userID, contentUUID: UUID, listID: foundList._id, active: 1 });
    } else {
        // check all lists for this user
        bookmarkFound = await interactBookmark.findOne({ userID, contentUUID: UUID, active: 1 });
    }

    if (!bookmarkFound || bookmarkFound?.active == 0) return null
    return bookmarkFound;
}

module.exports = { isContentBookmarked };