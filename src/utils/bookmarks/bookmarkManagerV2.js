const interactBookmark = require("../../schemas/bookmarks/interactBookmark");
const interactBookmarkListIndex = require("../../schemas/bookmarks/interactBookmarkListIndex");
const interactBookmarkList = require("../../schemas/bookmarks/interactBookmarkList");
const interactPostSchema = require("../../schemas/interactPostSchema");
const { checktime } = require("../checktime");
const { v4: uuidv4 } = require("uuid");
const { findContentType } = require("../general/findContentType");
const { findContentData } = require("../general/findContentData");
const { isContentBookmarked } = require("./isContentBookmarked");
// multi bookmarked content
// backend: getPosts need to show lists post is bookmarked in
// frontend: if bookmarked, have dropdown for removing bookmarks save to another list
// WIP, not tested, NOT DONE

const MAX_BOOKMARKS_SAVES = 25;
const CURRENT_BOOKMARK_VERSION = 2.0;

/**
 * get user bookmarks
 * 
 * no extra data:
 * returns, possible lists, main list, current index, bookmarks within+ the data of the bookmarks
 * 
 * return { bookmarks: [], lists: [], indexData: {}, listData: {}} 
 */
async function getUserBookmarks({ userID, listname=null, listID=null, indexID=null }) {
    if (!userID) return { error: true, msg: "No userID provided" };

    if (!listname && !listID && !indexID) listname = "main"; // default to main if no list or index provided

    const listsFound = await getBookmarkLists({ userID });
    if (listsFound.error) return listsFound;

    const foundListIndex = await findBookmarkListIndex({ userID, listID, listname, indexID, createNew: false });
    if (!foundListIndex || foundListIndex.error) return foundListIndex;

    const foundList = await findListID({ userID, listID: foundListIndex.listID, createNew: false });
    if (!foundList || foundList.error) return foundList;

    const bookmarksFound = [];
    const bookmarksData = [];//await interactBookmark.find({ _id: { $in: foundListIndex.saves }, active: 1 });
    const foundErrors = [];

    for (const bookmarkID of foundListIndex.saves) {
        var pushed = false;
        const bookmarkData = await interactBookmark.findOne({ _id: bookmarkID, active: 1 });
        if (bookmarkData) {
            const contentData = await findContentData(userID, bookmarkData.contentUUID, bookmarkData.contentType);
            if (contentData && !contentData.error) {
                bookmarksFound.push(bookmarkData);
                bookmarksData.push(contentData);
                pushed = true;
            } else {
                console.log("content data not found for bookmark?", bookmarkData, contentData);
            }
        }

        if (!pushed) foundErrors.push({ bookmarkID, msg: "bookmark not found or content not found", bookmarkData });
    }

    console.log("found bookmarks?", bookmarksFound, bookmarksData, foundErrors);
    return {
        success: true,
        lists: listsFound,
        listData: foundList,
        indexData: foundListIndex,
        bookmarks: bookmarksFound,
        bookmarksData
    }
}

/**
 * get user bookmark lists
 */

async function getBookmarkLists({ userID, showArchived=false }) {
    if (!userID) return { error: true, msg: "No userID provided" };

    const listsFound = await interactBookmarkList.find({ userID, active: showArchived == true ? 0 : 1 });
    if (!listsFound || listsFound.length==0) return { error: true, msg: "No lists found" };
    
    return listsFound;
}

/**
 * adjust / move a bookmark to another list or index
 * 
 * must provide userID and bookmarkID
 * must provider either listname or listID to the bookmark move to
 */
async function adjustSavedBookmarkList({ userID, bookmarkID, listname=null, listID=null }) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!bookmarkID) return { error: true, msg: "No bookmarkID provided" };
    if (!listname && !listID) return { error: true, msg: "No newListname or listID provided" };

    console.log("adjustSavedBookmarkList called", { userID, bookmarkID, listname, listID });
    const foundBookmark = await isContentBookmarked({ userID, bookmarkID });
    if (!foundBookmark || foundBookmark.error) return foundBookmark ? foundBookmark : { error: true, msg: "Content was not bookmarked"};

    // find or create list
    const foundList = await findListID({ userID, listname, listID, createNew: true});
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found or created" };

    // find or create index of list
    const foundListIndex = await findBookmarkListIndex({ userID, listID: foundList._id, createNew: true });
    if (!foundListIndex) return { error: true, msg: "no list index found, and couldnt create"}

    // remove from old list index
    await interactBookmarkListIndex.findOneAndUpdate(
        { _id: foundBookmark.indexID },
        { $pull: { saves: foundBookmark._id } },
        { new: true } 
    );

    // push to new list index
    const addedToList = await interactBookmarkListIndex.findOneAndUpdate(
        { _id: foundListIndex._id },
        { $push : { "saves" : foundBookmark._id } },
        { new: true }
    );

    // update bookmark to new list and index
    foundBookmark.listID = foundList._id;
    foundBookmark.indexID = foundListIndex._id;

    foundBookmark.save();

    return {
        success: true,
        bookmark: foundBookmark,
        list: foundList,
        listIndex: addedToList
    };
}

/**
 * add to bookmark
 * 
 * THIS FUNCTION NOT COMPLETE
 */
async function saveBookmark({ userID, UUID, contentType, listID=null, listname="main" }) {
    if (!userID) return { error: true, msg: "no userID provided" };
    if (!contentType) {
        // find content
        const contentTypeFound = await findContentType(UUID);
        if (contentTypeFound<0) return { error: true, msg: "content not found" };
        contentType = contentTypeFound;
    }

    // find or create list
    const foundList = await findListID({ userID, listname, listID, createNew: true});
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found or created" };
    // maybe make find list have the current index, and if count is over, then make a new one on  after adding to index?
    
    // check if already bookmarked (in list) 
    const isBookmarked = await isContentBookmarked({ userID, UUID, contentType, listID: foundList._id });
    if (isBookmarked && !isBookmarked.error) return isBookmarked?.error ? isBookmarked : { error: true, msg: "content already bookmarked in that list" };

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
    await interactBookmarkListIndex.findOneAndUpdate({
        _id: foundListIndex._id,
    }, {
        $push : { "saves" : newBookmark._id }
    }, {
        new: true
    });

    // console.log("check if i added to list?", addedToList);
    if (newBookmark.contentType==0) {
        await interactPostSchema.findOneAndUpdate({
            _id: newBookmark.contentUUID 
        }, {
            $inc: { totalBookmarks: 1 }
        });
    }

    return {
        success: true,
        bookmark: newBookmark,
        list: foundList,
        listIndex: foundListIndex
    };
}

/**
 * remove a bookmark from a list
 */
async function removeBookmark({ userID, bookmarkID, UUID, contentType, listname, listID }) {
    // either UUID and ListID
    // or bookmarkID
    if (!userID) return { error: true, msg: "No userID provided" };
    console.log("remove bookmark called", { userID, bookmarkID, UUID, contentType, listname, listID });
    if (!UUID && !(listID && listname) && !bookmarkID) return { error: true, msg: "No UUID or listID/list or bookmarkID provided" };

    // check for bookmark
    const foundBookmark = await isContentBookmarked({ userID, UUID, contentType, listID, listname, bookmarkID });
    if (!foundBookmark || foundBookmark.error) return foundBookmark ? foundBookmark : { error: true, msg: "Content was not bookmarked"};

    // remove from bookmarkList, and -1 on post schema
    const removedFromList = await interactBookmarkListIndex.findOneAndUpdate(
        { _id: foundBookmark.indexID },
        { $pull: { saves: foundBookmark._id } },
        { new: true } 
    );


    console.log("check if i can delete the list?", removedFromList, foundBookmark);
    if (foundBookmark.contentType==0) {
        await interactPostSchema.findOneAndUpdate({
            _id: foundBookmark.contentUUID, totalBookmarks: { $gt: 0 }
        }, {
            $inc: { totalBookmarks: -1 }
        });
    }

    foundBookmark.active = 0;
    foundBookmark.archivedTimestamp = checktime();

    foundBookmark.save();
    // await interactBookmark.findOneAndUpdate({
    //     _id: foundBookmark._id
    // }, {
    //     active: 0,
    //     archivedTimestamp: checktime()
    // });

    return { success: true, foundBookmark }
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
    console.log("created new list", newBookmarkList);
    return newBookmarkList;
}

/**
 * find a listID by list name
 */
async function findListID({ userID, listname, listID, createNew=false }) {
    if (!listname && !listID) return { error: true, msg: "No listname or listID provided" };

    if (listID) {
        const foundListByID = await interactBookmarkList.findOne({ _id: listID, userID });
        if (foundListByID) return foundListByID;
        else return { error: true, msg: "no list found with that ID"}
        // do not create new if searching by ID
    }

    if (!listname) return { error: true, msg: "No listname provided" };
    
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
        const findIndex = await findListID({ userID, listID, createNew: false});
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
async function findBookmarkListIndex({ userID, listID, listname, indexID=null, createNew=false }) {
    if (!listID && listname) {
        const foundList = await findListID({ userID, listname, createNew: false});
        if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found with that name"}
        
        listID = foundList._id;
    }

    if (indexID) {
        const foundIndexByID = await interactBookmarkListIndex.findOne({ _id: indexID });
        
        if (listID && foundIndexByID.listID != listID) return { error: true, msg: "index does not belong to that list"};
        if (foundIndexByID) return foundIndexByID;
        else return { error: true, msg: "no index found with that ID"}
    }

    const foundBookmarkIndex = await interactBookmarkListIndex.findOne({ listID, current: true });
    if (!foundBookmarkIndex && createNew==true) return createBookmarkListIndex({ userID, listID, fromFind: true })
    else if (!foundBookmarkIndex) return {error: true, msg: "no index from for bookmark list"}
    else if (foundBookmarkIndex && foundBookmarkIndex.saves && foundBookmarkIndex.saves.length < MAX_BOOKMARKS_SAVES) return foundBookmarkIndex;
    else return createBookmarkListIndex({ userID, listID, prevBookmarkIndex: foundBookmarkIndex, fromFind: true })
}

module.exports = {
    saveBookmark,
    removeBookmark,
    adjustSavedBookmarkList,
    isContentBookmarked,
    getBookmarkLists,
    getUserBookmarks
}