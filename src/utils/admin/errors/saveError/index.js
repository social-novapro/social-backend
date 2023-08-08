const { v4: uuidv4 } = require("uuid");
const interactErrorSchema = require("../../../../schemas/admin/interactErrorSchema");
const { checktime } = require("../../../checktime");

async function saveErrorToDB({ errorCode, errorMsg, userID }) {
    const errorID = uuidv4();

    await interactErrorSchema.create({
        _id: errorID,
        userID: userID || "unknown",
        timestamp: checktime(),
        errorCode,
        errorMsg,
        resolved: false,
        reviewed: false,
        reviewedBy: null,
        reviewedTimestamp: null
    });

    return errorID;
}

module.exports = { saveErrorToDB };