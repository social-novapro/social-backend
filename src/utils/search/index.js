const interactUserSearchSchema = require("../../schemas/user/interactUserSearchSchema");
const { checktime } = require("../checktime");
const { searchErrorV2 } = require("../searchError");
const { searchV1 } = require("./searchV1");
const { searchV2 } = require("./searchV2");

async function getUserSearch({ lookUpKey, userID }) {
    if (!lookUpKey) return searchErrorV2("U001", { userID: "unknown" });
    if (!userID) return searchErrorV2("U002", { userID: "unknown" });

    const foundPref = await getPrefSearch({ userID });
    if (foundPref.preferredSearch === "v1") {
        return await searchV1({ lookUpKey, userID });
    } else if (foundPref.preferredSearch === "v2") {
        return await searchV2({ lookUpKey, userID });
    } else {
        return searchErrorV2("U003", { userID })
    }
}

async function getPrefSearch({ userID }) {
    const foundPref = await interactUserSearchSchema.findOne({ _id: userID });
    if (foundPref) return foundPref;

    await interactUserSearchSchema.create({
        _id: userID,
        timestamp: checktime(),
        preferredSearch: "v1"
    });

    const newPref = await interactUserSearchSchema.findOne({ _id: userID });
    return newPref;
}

async function updatePrefSearch({ userID, newSearch }) {
    const foundPref = await getPrefSearch({ userID });
    if (foundPref.preferredSearch === newSearch) return foundPref;

    for (const search of getPossibleSearch()) {
        if (search.name === newSearch) {
            await interactUserSearchSchema.findOneAndUpdate({ _id: userID }, {
                 preferredSearch: newSearch, 
                timestamp: checktime()
            });
            return await exportSearchSettingPage({ userID });
        }
    }

    return searchErrorV2("U004", { userID });
}

function getPossibleSearch() {
    return [{
        name: "v1",
        niceName: "Original Search",
        description: "The original search method, using direct comparing of posts.",
        version: 1
    }, {
        name: "v2",
        niceName: "Embedding Search",
        description: "The new search method, using embeddings for similarities of posts.",
        version: 2
    }];
}

async function exportSearchSettingPage({ userID }) {
    const exporting = {
        userID,
        possibleSearch: getPossibleSearch(),
        currentSearch: await getPrefSearch({ userID })
    }

    return exporting;
}

module.exports = {
    getUserSearch,
    updatePrefSearch,
    exportSearchSettingPage
}