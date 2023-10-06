const interactPostSchema = require("../../../schemas/interactPostSchema");
const interactPostBookmarks = require("../../../schemas/postSchemas/interactPostBookmarks");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");

/*
async function getBookmarkSave({ userID, postID, listname }) {
    const bookmark = await interactPostBookmarks.findOne(
        { _id: userID },
        { saves: { $elemMatch: { 
            _id: postID,
            bookmarkList: listname || "main"
        }}}
    );
    
    return bookmark;
}

async function unbookmarkPost({userID, postID, listname}) {
    if (!postID) return searchErrorV2("K001", { userID });

    // check if in bookmarks
    await interactPostBookmarks.findOne({
        _id: userID,
    })
}
*/

async function bookmarkPost({userID, postID, listname}) {
    if (!postID) return searchErrorV2("K001", { userID });

    const postCheck = await interactPostSchema.findOne({ _id: postID});
    if (!postCheck) return searchErrorV2("K002", { userID });

    const savedTimestamp = checktime();
    var userbookmarks = await interactPostBookmarks.findOne({ _id: userID }) 
    
    if (!userbookmarks) {
        await setupMainBookmark({userID});
        userbookmarks = await interactPostBookmarks.findOne({ _id: userID });
    };

    var foundList = false;
    var foundMain = false;

    if (listname && userbookmarks && userbookmarks.lists) {
        for (const list of userbookmarks.lists) {
            if (list.name == listname) foundList = true;
            if (list.name == "main") foundMain = true;
        };
    };

    if (userbookmarks && userbookmarks.saves)  {
        for (const save of userbookmarks.saves) {
            if (save._id == postID) return searchErrorV2("K003", { userID })
        }
    }
    if (!foundMain) await setupMainBookmark({userID})
    var bookmarkToSave = foundList ? listname : "main"
    
    await interactPostBookmarks.findOneAndUpdate( 
        { _id: userID },
        { $push : { "saves" : { 
            _id: postID,
            bookmarkList: bookmarkToSave,
            timestamp: savedTimestamp
        }}},
        { upsert: true }
    );

    const Bookmarks = await interactPostBookmarks.findOne({ _id: userID });
    if (!Bookmarks) return searchErrorV2("K004", { userID });
    else return {Bookmarks};
};

async function setupMainBookmark({userID}) {
    await interactPostBookmarks.findOneAndUpdate( 
        { _id: userID },
        { $push : { "lists" : { 
            name: "main",
            timestamp: checktime()
        }}},
        { upsert: true }
    );
};

async function getBookmarks({userID}) {
    const userbookmarks = await interactPostBookmarks.findOne({ _id: userID });
    if (!userbookmarks) return searchErrorV2("K004", { userID });
    else return userbookmarks;
}

module.exports = { bookmarkPost, getBookmarks };