const interactAdminUpdateActionsSchema = require("../../../schemas/admin/interactAdminUpdateActionsSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { updateUserBadges, undoUserBadges } = require("../../user/badges/firstRun");
const { undoAllUsernameLc, updateAllUsernameLc } = require("../../userAuth");
const { undoAllPostIndexes, updateAllPostIndexes } = require("./postIndexes");
const { updateAllTimestamps, undoAllTimestamps } = require("./timestamps");

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

async function undoBadges({ adminID }) {
    return afterCompletion();
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
    return afterCompletion();
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
    return afterCompletion();
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
    return afterCompletion();
}

function afterCompletion() {
    return { done: false, error: true }
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
}