const interactAdminUpdateActionsSchema = require("../../../schemas/admin/interactAdminUpdateActionsSchema");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { undoAllUsernameLc, updateAllUsernameLc } = require("../../userAuth")

async function updateUsernameLc({ adminID }) {
    /* check adminID later */
    const doneAction = await interactAdminUpdateActionsSchema.findOne({ _id: "usernameLc" });
    if (doneAction && doneAction.done==true) return searchErrorV2("R015", { userID: adminID });

    const result = await updateAllUsernameLc();
    await interactAdminUpdateActionsSchema.create({
        _id: "usernameLc",
        done: true,
        timestamp: checktime(),
    })

    return result;
}

async function undoUsernameLc({ adminID }) {
    /* check adminID later */
    const result = await undoAllUsernameLc();
    await interactAdminUpdateActionsSchema.findOneAndDelete({ _id: "usernameLc" })
    return result;
}


module.exports = { 
    updateUsernameLc,
    undoUsernameLc
}