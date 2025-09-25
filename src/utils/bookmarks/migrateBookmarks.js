const { v4: uuidv4 } = require('uuid');
const interactPostBookmarks = require('../../schemas/postSchemas/interactPostBookmarks');
const { checktime } = require('../checktime');

// WIP, not completed

async function migrateBookmarks() {
    const allBookmarks = await interactPostBookmarks.find({});

    for (const userBookmarks of allBookmarks) {
        // await interactPostBookmarks.findOneAndDelete({ _id: userBookmarks._id });

        var listsMap = {};

        if (userBookmarks.lists && userBookmarks.lists.length > 0) {
            for (const list of userBookmarks.lists) {
                if (!list.name) continue;

                if (!listsMap[list.name]) {
                    listsMap[list.name] = {
                        id: uuidv4(),
                        name: list.name,
                        timestamp: list.timestamp,
                    }
                } else {
                    // duplicated list name
                    console.log("DUPLICATED LIST NAME, changing to other list", list.name, userBookmarks._id);
                    listsMap[list.name].timestamp = Math.min(listsMap[list.name].timestamp, list.timestamp);
                }
            }
        }

        if (!listsMap["main"]) {
            listsMap["main"] = {
                id: uuidv4(),
                name: "main",
                timestamp: checktime(),
            }
        }

        if (userBookmarks.saves && userBookmarks.saves.length > 0) {
            for (const save of userBookmarks.saves) {
                if (!save._id) continue; // no postID

                var listIDUse = null;
                if (save.bookmarkList && listsMap[save.bookmarkList]) {
                    listIDUse = listsMap[save.bookmarkList].id;
                } else {
                    listIDUse = listsMap["main"].id;
                }

                const newBookmark = {
                    _id: uuidv4(),
                    userID: userBookmarks._id,
                    version: 2,
                    timestamp: save.timestamp || checktime(),
                    listID: listIDUse,
                    bookmarkType: 0, // post
                }

                // 
            }
        }
    }
}