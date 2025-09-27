const interactBookmark = require("../../schemas/bookmarks/interactBookmark");
const interactBookmarkListIndex = require("../../schemas/bookmarks/interactBookmarkListIndex");
const interactBookmarkList = require("../../schemas/bookmarks/interactBookmarkList");
const interactPostSchema = require("../../schemas/interactPostSchema");
const { checktime } = require("../checktime");
const { v4: uuidv4 } = require("uuid");
const { findContentType } = require("../general/findContentType");

// WIP, not tested, NOT DONE

const MAX_BOOKMARKS_SAVES = 25;
const CURRENT_BOOKMARK_VERSION = 2.0;

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
    if (!UUID) return { error: true, msg: "No UUID provided" };

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
        $upsert: true
    });

    // console.log("check if i added to list?", addedToList);
    if (newBookmark.contentType==0) {
        await interactPostSchema.findOneAndUpdate({
            _id: newBookmark.contentUUID 
        }, {
            $inc: { totalBookmarks: 1 }
        });
    }

    return newBookmark;
}

/**
 * remove a bookmark from a list
 */
async function removeBookmark({ userID, bookmarkID, UUID, contentType, listname, listID }) {
    // either UUID and ListID
    // or bookmarkID
    if (!userID) return { error: true, msg: "No userID provided" };
    console.log("remove bookmark called", { userID, bookmarkID, UUID, contentType, listname, listID });
    if ((!UUID || (!listID && !listname)) && !bookmarkID) return { error: true, msg: "No UUID or listID or bookmarkID provided" };

    // check for bookmark
    const foundBookmark = await isContentBookmarked({ userID, UUID, listID, listname, bookmarkID });
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
async function findBookmarkListIndex({ userID, listID, createNew=false }) {
    const foundBookmarkIndex = await interactBookmarkListIndex.findOne({ listID, current: true });
    if (!foundBookmarkIndex && createNew==true) return createBookmarkListIndex({ userID, listID, fromFind: true })
    else if (!foundBookmarkIndex) return {error: true, msg: "no index from for bookmark list"}
    else if (foundBookmarkIndex && foundBookmarkIndex.saves && foundBookmarkIndex.saves.length < MAX_BOOKMARKS_SAVES) return foundBookmarkIndex;
    else return createBookmarkListIndex({ userID, listID, prevBookmarkIndex: foundBookmarkIndex, fromFind: true })
}

module.exports = {
    saveBookmark,
    removeBookmark,
    isContentBookmarked
}