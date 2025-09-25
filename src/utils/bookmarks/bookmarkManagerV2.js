const interactBookmark = require("../../schemas/bookmarks/interactBookmark");
const interactBookmarkListIndex = require("../../schemas/bookmarks/interactBookmarkListIndex");
const interactBookmarkList = require("../../schemas/bookmarks/interactBookmarkListIndex");
const interactPostSchema = require("../../schemas/interactPostSchema");
const { checktime } = require("../checktime");
const { v4: uuidv4 } = require("@dothq/id")

// WIP, not tested, NOT DONE

const MAX_BOOKMARKS_SAVES = 25;
const CURRENT_BOOKMARK_VERSION = 2.0;

/**
 * add to bookmark
 * 
 * THIS FUNCTION NOT COMPLETE
 */
async function saveBookmark({ userID, UUID, contentType, listID, listname="main" }) {
    if (!userID) return { error: true, msg: "no userID provided" };

    // find or create list
    const foundList = await findListID({ userID, listname, createNew: true});
    if (!foundList) return { error: true, msg: "no list found, and couldnt create"}

    // maybe make find list have the current index, and if count is over, then make a new one on  after adding to index?
    
    // find or create index of list
    const foundListIndex = await findBookmarkListIndex({ userID, listID: foundList._id, createNew: true });
    if (!foundListIndex) return { error: true, msg: "no list index found, and couldnt create"}

    // create bookmark save
    const newBookmark = new interactBookmark({
        _id: uuidv4(),
        version: CURRENT_BOOKMARK_VERSION,
        contentUUID: UUID,
        contentType: contentType,
        userID: userID,
        timestamp: checktime(),
        listID: foundList._id,
        indexID: foundListIndex._id,
        active: 1
    });

    newBookmark.save();

    // push to index
    // remove from bookmarkList, and -1 on post schema
    const addedToList = await interactBookmarkListIndex.findOneAndUpdate({
        _id: foundListIndex._id,
    }, {
        $push : { "saves" : newBookmark._id }
    }, {
        $upsert: true
    });

    console.log("check if i added to list?", addedToList);
    if (bookmarkFound.contentType==0) {
        const foundPost = await interactPostSchema.findOne({ _id: bookmarkFound.contentUUID });
        if (foundPost) {
            foundPost.totalBookmarks ? foundPost.totalBookmarks++ : 1;
            foundPost.save();
        }
    }

    return newBookmark;
}

/**
 * remove a bookmark from a list
 */
async function removeBookmark({ userID, UUID, listID, bookmarkID }) {
    // either UUID and ListID
    // or bookmarkID
    if (!userID) return { error: true, msg: "No userID provided" };
    if ((!UUID || !listID) && !bookmarkID) return { error: true, msg: "No UUID or listID or bookmarkID provided" };

    var bookmarkFound;
    if (bookmarkID) {
        bookmarkFound = await interactBookmark.findOne({ _id: bookmarkID });
    } else {
        bookmarkFound = await interactBookmark.findOne({ contentUUID: UUID, listID: listID });
    }

    if (!bookmarkFound) return { error: true, msg: "Content was not bookmarked"};

    // remove from bookmarkList, and -1 on post schema
    const removedFromList = await interactBookmarkListIndex.findOneAndUpdate({
        _id: bookmarkFound.indexID,
    }, {
        $pull : { "saves" : bookmarkFound._id }
    }, {
        $upsert: true
    });

    console.log("check if i can delete the list?", removedFromList);
    if (bookmarkFound.contentType==0) {
        const foundPost = await interactPostSchema.findOne({ _id: bookmarkFound.contentUUID });
        if (foundPost) {
            foundPost.totalBookmarks ? foundPost.totalBookmarks-- : 0;
            foundPost.save();
        }
    }

    return { success: true, bookmarkFound }
}

/**
 * create a new list
 */
async function createList({ userID, listname, fromFind=false }) {
    // in case it was not called by findListID, double check
    if (!fromFind) {
        const findList = await findListID({ userID, listname, createNew: false});
        if (findList) return findList;
        // { error: true, msg: "list with that name already created"}
        // do i care if user already created one with same name? maybe
    }

    // need to create a list
    // if having toruble, switch back to .create()
    const newBookmarkList = new interactBookmarkList({
        _id: uuidv4(),
        version: CURRENT_BOOKMARK_VERSION,
        listname: listname,
        // currentIndexID
        userID: userID,
        timestamp: checktime(),
        active: 1
    });
    newBookmarkList.save();

    return newBookmarkList;
}

/**
 * find a listID by list name
 */
async function findListID({ userID, listname, createNew=false }) {
    const foundList = await interactBookmarkList.findOne({ listname, userID })
    if (foundList) return foundList;
    else if (createNew==true) return createList({ userID, listname, fromFind: true}); // TODO: check this
    else return { error: true, msg: "no list found with that name"}
}

/**
 * deletes bookmark list
 * 
 * NOT DONE
 */
async function deleteBookmarkList({ userID, listID }) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!listID) return { error: true, msg: "No listID provided" };

    // const listIndexesFound = await interactBookmarkList.find({ listID, userID });
    // if (!listIndexesFound || !listIndexesFound[0]) return { error: true, msg: "No list found" };

    // for (const listIndex of listIndexesFound) {

    // }
}

/**
 * create a bookmark index
 */
async function createBookmarkListIndex({ userID, listID, prevBookmarkIndex, fromFind=false }) {
    if (!fromFind && !prevBookmarkIndex) { // if its not from find, and theres no prev provided
        const findIndex = await findListID({ userID, listname, createNew: false});
        if (findIndex && findIndex.saves && findIndex.saves.length<MAX_BOOKMARKS_SAVES) return findIndex;
        // { error: true, msg: "index for that list already created"}
    }

    const newBookmarkListIndex = new interactBookmarkListIndex({
        _id: uuidv4(),
        version: CURRENT_BOOKMARK_VERSION,
        listID,
        timestamp: checktime(),
        prevID: prevBookmarkIndex ? prevBookmarkIndex._id : null,
        nextID: null,
        current: true,
        saves: []
    });

    newBookmarkListIndex.save();

    if (prevBookmarkIndex) {
        await interactBookmarkListIndex.findOneAndUpdate({
            _id: prevBookmarkIndex._id
        }, {
            nextID: newBookmarkListIndex._id,
            current: false
        })
    };

    // await interactBookmarkList.findOneAndUpdate({
    //     _id: listID,
    // }, {
    //     currentIndexID: newBookmarkListIndex._id
    // });

    return newBookmarkListIndex;
}

/**
 * find a bookmark index
 */
async function findBookmarkListIndex({ userID, listID, createNew=false }) {
    const foundBookmarkIndex = await interactBookmarkListIndex.findOne({ listID, current: true });
    if (!foundBookmarkIndex && createNew==true) return createBookmarkListIndex({ userID, listID, fromFind: true })
    else if (!foundBookmarkIndex) return {error: true, msg: "no index from for bookmark list"}
    else if (foundBookmarkIndex && foundBookmarkIndex.saves && foundBookmarkIndex.saves.length < MAX_BOOKMARKS_SAVES) return foundBookmarkIndex;
    else return createBookmarkListIndex({ userID, listID, prevBookmarkIndex: foundBookmarkIndex, fromFind: true })
}

module.exports = {
    saveBookmark
}