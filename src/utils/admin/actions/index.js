const interactAdminUpdateActionsSchema = require("../../../schemas/admin/interactAdminUpdateActionsSchema");
const { checktime } = require("../../checktime");
const { categorizeAllPosts, undoAllCategorizePosts } = require("../../post/categories/updateAction");
const { updateAllPostEmbeddings, undoAllPostEmbeddings } = require("../../search/embed/firstRun");
const { searchErrorV2 } = require("../../searchError");
const { updateUserBadges, undoUserBadges } = require("../../user/badges/firstRun");
const { undoAllUsernameLc, updateAllUsernameLc } = require("../../userAuth");
const { undoAllPostIndexes, updateAllPostIndexes } = require("./postIndexes");
const { updateAllTimestamps, undoAllTimestamps } = require("./timestamps");
const { updateAllUserPostIndexes, undoAllUserPostIndexes } = require("./userPostIndexes");

// APR 2024 - 1.4, MAR 2025 - 1.7, JUN 2025 - 1.8
async function updatePostEmbeddings({ adminID, version=null }) {
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: `postEmbeddings${version?version:""}` });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    if (version) await undoAllPostEmbeddings();

    const result = await updateAllPostEmbeddings();
    await interactAdminUpdateActionsSchema.create({
        _id: `postEmbeddings${version?version:""}`,
        done: true,
        timestamp: checktime(),
    })
    return result;
}

async function undoPostEmbeddings({ adminID, version=null }) {
    await undoAllPostEmbeddings();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: `postEmbeddings${version?version:""}` })
    return { done: true }
}

// FEB 2024 - 1.4
async function updateBadges({ adminID }) {
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "badgesInit" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateUserBadges();
    await interactAdminUpdateActionsSchema.create({
        _id: "badgesInit",
        done: true,
        timestamp: checktime(),
    })
    return result;
}

async function undoBadges() {
    await undoUserBadges();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "badgesInit" })
    return { done: true }
}


// DEC 2023 - 1.3 - 2
async function updatePostIndexes({ adminID }) {
    //const c
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "postIndexes" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateAllPostIndexes({ adminID });
    await interactAdminUpdateActionsSchema.create({
        _id: "postIndexes",
        done: true,
        timestamp: checktime(),
    })
    return result;
}

async function undoPostIndexes({ adminID }) {
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "postIndexes" });

    await undoAllPostIndexes({ adminID });
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "postIndexes" })
    return { done: true }
}

// DEC 2023 - 1.3 - 1
async function updateTimestamps({ adminID }) {
    /* check adminID later */
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "timestamps" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateAllTimestamps();
    await interactAdminUpdateActionsSchema.create({
        _id: "timestamps",
        done: true,
        timestamp: checktime(),
    })

    return result;
}

async function undoTimestamps({ adminID }) {
    /* check adminID later */
    const result = await undoAllTimestamps();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "timestamps" })
    return result;
}

// NOV 2023 - 1.1.1
async function updateUsernameLc({ adminID }) {
    /* check adminID later */
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "usernameLc" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateAllUsernameLc();
    return result;
}

async function undoUsernameLc({ adminID }) {
    /* check adminID later */
    const result = await undoAllUsernameLc();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "usernameLc" })
    return result;
}


// JAN 2025 - 1.6.4
async function updateUserPostIndexes({ adminID }) {
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "userPostIndexes" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateAllUserPostIndexes({ adminID });
    await interactAdminUpdateActionsSchema.create({
        _id: "userPostIndexes",
        done: true,
        timestamp: checktime(),
    });

    return result;
}

async function undoUserPostIndexes({ adminID }) {
    await undoAllUserPostIndexes({ adminID });
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "userPostIndexes" })
    return { done: true }
}

// MAR 2025 - 1.7, JUN 2025 - 1.8
async function updateCategorizePosts({ adminID, version=null }) {
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "categorizePosts"+(version?version:"") });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await categorizeAllPosts();
    await interactAdminUpdateActionsSchema.create({
        _id: "categorizePosts"+(version?version:""),
        done: true,
        timestamp: checktime(),
    });

    return result;
};

async function undoCategorizePosts({ adminID, version=null }) {
    await undoAllCategorizePosts();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "categorizePosts"+(version?version:"") })
    return { done: true }
}

module.exports = { 
    updateUsernameLc,
    undoUsernameLc,
    updateTimestamps,
    undoTimestamps,
    updatePostIndexes,
    undoPostIndexes,
    updateBadges,
    undoBadges,
    updatePostEmbeddings,
    undoPostEmbeddings,
    updateUserPostIndexes,
    undoUserPostIndexes,
    updateCategorizePosts,
    undoCategorizePosts
}

