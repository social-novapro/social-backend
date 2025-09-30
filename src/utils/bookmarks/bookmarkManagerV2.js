const interactBookmark = require("../../schemas/bookmarks/interactBookmark");
const interactBookmarkListIndex = require("../../schemas/bookmarks/interactBookmarkListIndex");
const interactBookmarkList = require("../../schemas/bookmarks/interactBookmarkList");
const interactPostSchema = require("../../schemas/interactPostSchema");
const { checktime } = require("../checktime");
const { v4: uuidv4 } = require("uuid");
const { findContentType } = require("../general/findContentType");
const { findContentData } = require("../general/findContentData");
const { isContentBookmarked } = require("./isContentBookmarked");
const { getPrivacySetting, validPrivacyOption, findFullDetailByDbTitle } = require("../privacy");

// instead of "main", have "default" list, which ticks a box to be default list

// multi bookmarked content
// backend: getPosts need to show lists post is bookmarked in
// frontend: if bookmarked, have dropdown for removing bookmarks save to another list
// WIP, not tested, NOT DONE

const DEFAULT_LIST_NAME = "main";
const MAX_BOOKMARKS_SAVES = 25;
const CURRENT_BOOKMARK_VERSION = 2.0;
const MIN_LENGTH_LISTNAME = 3;
const MAX_LENGTH_LISTNAME = 30;
const MAX_LENGTH_DESCRIPTION = 200;

var detailedFullAllow = null;

function allowedListChanges() {
    if (detailedFullAllow) return detailedFullAllow;
    const foundPrivDetails = findFullDetailByDbTitle("bookmarks");
    const allowedListChanges = {
        simple: ["listname", "default", "description", "privacy"],
        detailed: {
            listname: { type: "string", min: MIN_LENGTH_LISTNAME, max: MAX_LENGTH_LISTNAME },
            default: { type: "boolean" },
            description: { type: "string", min: 0, max: MAX_LENGTH_DESCRIPTION },
            privacy: { type: "int", details: foundPrivDetails} 
        }
    };
    detailedFullAllow = allowedListChanges;
    return allowedListChanges;
}

function validateListname(listname) {
    if (!listname) return { valid: false, msg: "No listname provided" };

    if (listname.length < MIN_LENGTH_LISTNAME) return { error: true, msg: `Listname too short, must be at least ${MIN_LENGTH_LISTNAME} characters` };
    if (listname.length > MAX_LENGTH_LISTNAME) return { error: true, msg: `Listname too long, must be at most ${MAX_LENGTH_LISTNAME} characters` };
    
    return { valid: true };
}

function makeListDataDefault(listData) {
    if (!listData) return { error: true, msg: "No list data provided" };
    if (!listData.listname) listData.listname = DEFAULT_LIST_NAME;
    if (!listData.description) listData.description = listData.listname + "Bookmark List";
    if (!listData.privacy) listData.privacy = 4;
    if (listData.default !== true && listData.default !== false) listData.default = false;
    return listData;
}

/**
 * update bookmark list info
 * 
 * can update: name, default (if true, make other lists default false), description, privacy
 */
async function updateBookmarkList({ userID, listID, newInfo={}}) {
    if (!userID) return { error: true, msg: "No userID provided" };
    var foundList = await findListID({ userID, listID, createNew: false });
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "list specified not found" };

    const changesMade = [];

    for (const key in newInfo) {
        if (!allowedListChanges().simple.includes(key)) {
            changesMade.push({ key, msg: "not allowed to change that key" });
            continue;
        }
        if (newInfo[key]===null || newInfo[key]===undefined) {
            changesMade.push({ key, msg: "no value provided" });
            continue;
        }

        const changeValueTo = newInfo[key];
        if (foundList[key] === changeValueTo) {
            changesMade.push({ key, msg: "no change in value" });
            continue; // no change
        }

        switch (key) {
            case "listname":
                const validated = validateListname(changeValueTo);
                if (validated.error) {
                    changesMade.push({ key, msg: validated.msg });
                }
                foundList.listname = changeValueTo;
                changesMade.push({ key, msg: "listname changed" });
                break;
            case "default":
                if (changeValueTo===true) { // making to true
                    var currentDefaultList = await findListID({ userID, getDefaultList: true, createNew: false });
                    // no default found?
                    if (currentDefaultList && !currentDefaultList.error) {
                        if (currentDefaultList._id === foundList._id) {
                            changesMade.push({ key, msg: "list already default" });
                            continue;
                        }

                        currentDefaultList.default = false;
                        currentDefaultList = makeListDataDefault(foundList);
                        try {
                            await currentDefaultList.save();
                        } catch (error) {
                            console.log(error)
                            changesMade.push({key, error: true, msg: "could not update current default list to false" });
                            continue;
                        }
                    } else {
                        changesMade.push({ key, msg: "no current default list found previously" });
                    }

                    // updating this list
                    foundList.default = true;
                    foundList = makeListDataDefault(foundList);
                    try {
                        await foundList.save();
                        changesMade.push({ key, msg: "list is now default" });
                    } catch (error) {
                        currentDefaultList.default = true;
                        try {
                            await currentDefaultList.save();
                            changesMade.push({ key, error: true, msg: "could not update new default list to true, but reverted old default" });
                        } catch(error) {
                            return { error: true, msg: "could not revert old default list to true, database may be inconsistent" };
                        }

                        return { error: true, msg: "could not update new default list to true" };
                    }
                } else if (changeValueTo===false) { // making it off
                    // if to off, make a new list default    
                    foundList.default = false;
                    foundList = makeListDataDefault(foundList);

                    try {
                        await foundList.save();
                        changesMade.push({ key, msg: "list is no longer default" });
                    } catch (error) {
                        return { error: true, msg: "could not update current list to false" };
                    }

                    const newDefaultList = await findListID({ userID, getDefaultList: true, createNew: true });    
                    if (!newDefaultList || newDefaultList.error) {
                        // undo 
                        foundList.default = true;
                        foundList = makeListDataDefault(foundList);
                        try {
                            await foundList.save();
                            changesMade.push({ key, error: true, msg: "could not find or create new default list, but reverted old default" });
                        } catch (error) {
                            return { error: true, msg: "could not revert old default list to true, database may be inconsistent" };
                        }
                    }
                }
                break;
            case "description":
                if (changeValueTo.length > MAX_LENGTH_DESCRIPTION) {
                    changesMade.push({ key, msg: `description too long, must be at most ${MAX_LENGTH_DESCRIPTION} characters` });
                    continue;
                }
                foundList.description = changeValueTo;
                changesMade.push({ key, msg: "description changed" });
                break;
            case "privacy":
                const validPrivacy = validPrivacyOption(userID, changeValueTo, "bookmarks");
                if (!validPrivacy || validPrivacy.error) {
                    changesMade.push({ key, msg: "privacy option not valid" });
                    continue;
                }
                foundList.privacy = changeValueTo;
                break;
            default:
                continue;
        }
        try {
            console.log(foundList)
            foundList = makeListDataDefault(foundList);
            await foundList.save();
        } catch (error) {
            console.log("error saving list changes?", error);
            return { error: true, msg: "could not save changes to list" };
        }
    }

    console.log(changesMade)
    const updatedList = await interactBookmarkList.findOne({ _id: foundList._id });
    return updatedList;
}

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

    // gets all lists, expect archived ones
    const listsFound = await getBookmarkLists({ userID });
    if (listsFound.error) return listsFound;

    // default list logic
    const getDefaultList = (!listname && !listID && !indexID) ? true : false;
    const foundList = await findListID({ userID, getDefaultList, listname, listID, createNew: false});
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found or created" };

    const foundListIndex = await findBookmarkListIndex({ userID, listID: foundList._id, createNew: true });
    if (!foundListIndex) return { error: true, msg: "no list index found, and couldnt create"}
    console.log(foundListIndex)

    // get default list, will create if not found
    // const foundDefaultList = await findListID({ userID, getDefaultList: true, createNew: true });


    // const foundListIndex = await findBookmarkListIndex({ userID, listID, listname, indexID, createNew: false });

    // const foundList = await findListID({ userID, getDefaultList: usingDefaultList, listID: foundListIndex.listID, createNew: false });
    // if (!foundList || foundList.error) return foundList;

    const bookmarksFound = [];
    const bookmarksData = [];//await interactBookmark.find({ _id: { $in: foundListIndex.saves }, active: 1 });
    const foundErrors = [];

    // get 
    // const foundListIndex = await findBookmarkListIndex({ userID, listID : listID/*? listID : foundDefaultList._id*/, listname, indexID, createNew: false });
    // if (!foundListIndex || foundListIndex.error) return foundListIndex;

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
async function saveBookmark({ userID, UUID, contentType, listID=null, listname=null }) {
    if (!userID) return { error: true, msg: "no userID provided" };
    if (!contentType) {
        // find content
        const contentTypeFound = await findContentType(UUID);
        if (contentTypeFound<0) return { error: true, msg: "content not found" };
        contentType = contentTypeFound;
    }
    
    // find or create list
    const getDefaultList = (!listname && !listID) ? true : false;
    const foundList = await findListID({ userID, getDefaultList, listname, listID, createNew: true});
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found or created" };
   
    // maybe make find list have the current index, and if count is over, then make a new one on  after adding to index?
    console.log('passed creation / found list', foundList);
    // check if already bookmarked (in list) 
    const isBookmarked = await isContentBookmarked({ userID, UUID, contentType, listID: foundList._id });
    if (isBookmarked && !isBookmarked.error) return isBookmarked?.error ? isBookmarked : { error: true, msg: "content already bookmarked in that list" };
    console.log("not bookmarked yet, continue to add");

    // find or create index of list
    const foundListIndex = await findBookmarkListIndex({ userID, listID: foundList._id, createNew: true });
    if (!foundListIndex) return { error: true, msg: "no list index found, and couldnt create"}
    console.log("found list index to add to", foundListIndex);
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
 * user facing create bookmark list
 */
async function createBookmarkListUser({userID, newInfo}) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!newInfo) return { error: true, msg: "No data provided for list" };
    if (!newInfo.listname) return { error: true, msg: "No listname provided" };

    // find or create list
    const foundList = await findListID({ userID, listname: newInfo.listname, createNew: true});
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found or created" };

    // find or create index of list
    const foundListIndex = await findBookmarkListIndex({ userID, listID: foundList._id, createNew: true });
    if (!foundListIndex) return { error: true, msg: "no list index found, and couldnt create"}

    // update list with new info
    const updatedList = await updateBookmarkList({ userID, listID: foundList._id, newInfo });
    if (updatedList.error) return updatedList;

    return {
        success: true,
        list: updatedList,
        listIndex: foundListIndex
    };
}

/**
 * verify bookmark list name is unique
 */
async function findBookmarkListUniqueName({ userID, listname, added=null }) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!listname) return { error: true, msg: "No listname provided" };

    const lookup = listname + (added ? `_${added}` : "");
    const foundList = await interactBookmarkList.findOne({ userID, listname: lookup, active: 1 });

    if (foundList) return findBookmarkListUniqueName({ userID, listname: listname, added: added ? added+1 : 1 });
    return lookup;
}

/**
 * create a new list
 */
async function createList({ userID, createDefault=false, listname, fromFind=false }) {
    // in case it was not called by findListID, double check
    if (!fromFind) {
        const findList = await findListID({ userID, listname, createNew: false});
        if (findList) return findList;
        // { error: true, msg: "list with that name already created"}
        // do i care if user already created one with same name? maybe
    }

    // default / name list logic
    const creatingDefault = (!listname && createDefault) ? true : false;
    const makeListName = creatingDefault ? DEFAULT_LIST_NAME : listname;
    if (!makeListName) return { error: true, msg: "No listname provided to make new list" };
    
    // find list with the name already
    const usingListName = await findBookmarkListUniqueName({ userID, listname: makeListName, added: null });

    const getUserPrivacy = await getPrivacySetting({userID, privacy: "bookmarks"});
    // need to create a list
    // if having toruble, switch back to .create()
    console.log("creating new list with name", usingListName, "privacy", getUserPrivacy);
    const newBookmarkList = new interactBookmarkList({
        _id: uuidv4(),
        version: CURRENT_BOOKMARK_VERSION,
        listname: usingListName,
        default: creatingDefault,
        description: creatingDefault ? "Default Bookmark List" : `${makeListName} bookmark list`,
        privacy: (getUserPrivacy && !getUserPrivacy.error) ? getUserPrivacy : 4,
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
 * public route for find list
 */
async function getListInfo({ userID, lookup }) {
    if (!userID) return { error: true, msg: "No userID provided" };
    if (!lookup) return { error: true, msg: "No lookup key provided" };

    const foundList = await findListID({ userID, getDefaultList:false, lookupkey:lookup, createNew: false });
    if (!foundList || foundList.error) return foundList ? foundList : { error: true, msg: "no list found with that name or ID" };

    return foundList;
}

/**
 * find a listID by list name
 */
async function findListID({ userID, getDefaultList=false, listname=null, listID=null, lookupkey=null, createNew=false }) {
    if ((!listname && !listID) && !getDefaultList && !lookupkey) return { error: true, msg: "No listname or listID provided" };
    
    if (getDefaultList) {
        const foundDefault = await interactBookmarkList.findOne({ userID, default: true, active: 1 });
        if (foundDefault) return foundDefault;
        else {
            // check for list named "main"
            const foundMain = await interactBookmarkList.findOne({ userID, listname: DEFAULT_LIST_NAME, active: 1 });
            if (foundMain) {
                // make it default
                foundMain.default = true;
                await foundMain.save();
                return foundMain;
            }

            // if (createNew) 
            // should always create new if no default found when trying to get default list
            return createList({ userID, createDefault: true, fromFind: true });
            // else return { error: true, msg: "no default list found" };
        }
    }

    if (lookupkey) {
        const lookByID = await interactBookmarkList.findOne({ _id: lookupkey, userID });
        if (lookByID) return lookByID;

        const lookByName = await interactBookmarkList.findOne({ listname: lookupkey, userID });
        if (lookByName) return lookByName;

        return { error: true, msg: "no list found with that lookup key"}
    }

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

async function getUserDefaultList({userID}) {
    if (!userID) return { error: true, msg: "No userID provided" };

    // const 
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
    getUserBookmarks,
    updateBookmarkList,
    allowedListChanges,
    getListInfo,
    createBookmarkListUser
}