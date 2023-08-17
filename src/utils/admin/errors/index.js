const interactAdminErrorIndexSchema = require("../../../schemas/admin/interactAdminErrorIndexSchema");
const interactAdminErrorSchema = require("../../../schemas/admin/interactAdminErrorSchema");
const { checktime } = require('../../checktime');
const { searchErrorV2 } = require("../../searchError");
const { getCurrentErrorIndex } = require("../indexesAdmin");
const { v4: uuidv4 } = require("uuid");

/* notes 
    resolving should be done by same user who is reviewing 

    can have an override review, which changes who is reviewing the error issue

    to change maybe
        reviewError() could auto activate override, instead of giving error right away


    todo
    if reviewerror gets reactivated, then start a new review process
*/

/* public function to set a error to resolved */
async function resolveError({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });

    const foundError = await findErrorIssue({ errorID, adminID });
    if (foundError.error) return foundError;

    if (!foundError.reviewedBy) return searchErrorV2("R010", { userID, adminID });
    if (foundError.reviewedBy != adminID) return searchErrorV2("R008", { userID: adminID });

    await resolveErrorDB({ errorID, adminID });

    const updatedError = await interactAdminErrorSchema.findOne({ _id: errorID })
    return updatedError;
}

/* public function to set error to in review */
async function reviewError({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });
    const foundError = await findErrorIssue({ errorID, adminID });
    if (foundError.error) return foundError;
    if (foundError.reviewedBy) return searchErrorV2("R011", { userID: adminID });
    await reviewErrorDB({ errorID, adminID });

    const updatedError = await interactAdminErrorSchema.findOne({ _id: errorID })
    return updatedError;
}

/* public functino to replace the current reviewer for an error */
async function overrideError({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });

    const foundError = await findErrorIssue({ errorID, adminID });
    if (foundError.error) return foundError;

    if (!foundError.reviewedBy) return searchErrorV2("R010", { userID, adminID });
    if (foundError.reviewedBy == adminID) return searchErrorV2("R009", { userID: adminID });

    await updateErrorHistoryDB({ errorID, reviewedBy: foundError.reviewedBy, reviewTimestamp: foundError.reviewTimestamp })
    
    await reviewErrorDB({ errorID, adminID });

    const updatedError = await interactAdminErrorSchema.findOne({ _id: errorID })
    return updatedError;
}

/* sets the error issue as resolved */
async function resolveErrorDB({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });

    const isAdmin = await isUserAdmin({ userID: adminID })
    if (!isAdmin) return;
    
    await interactAdminErrorSchema.findOneAndUpdate({
        _id: errorID,
    }, {
        resolved: true,
        resolvedTimestamp: checktime(),
        reviewedBy: adminID,
        /* removes the in review, since it is resolved */
        inReview: false
    })
}

/* sets the error Issue to in review */
async function reviewErrorDB({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });

    const isAdmin = await isUserAdmin({ userID: adminID })
    if (isAdmin.error) return isAdmin;
    
    await interactAdminErrorSchema.findOneAndUpdate({
        _id: errorID,
    }, {
        inReview: true,
        reviewedBy: adminID,
        reviewTimestamp: checktime()
    })
}

/* pushes previous review data to db */
async function updateErrorHistoryDB({ errorID, reviewedBy, reviewTimestamp}) {
    await interactAdminErrorSchema.findOneAndUpdate({ 
        _id: errorID, 
    }, { $push : { 
        "reviewHistory" : {
            _id: uuidv4(),
            reviewBy: reviewedBy,
            reviewStart: reviewTimestamp,
            reviewEnd: checktime()
        }
    }}, {
        upsert: true
    })
}

/* gets all errors, and you can change the type of sorting */
async function getErrorIssues({ adminID, indexID, sort }) {
    const isAdmin = await isUserAdmin({ userID: adminID })
    if (isAdmin.error) return isAdmin;

    var returnData = {
        "indexID": null,
        "nextIndexID": null,
        "prevIndexID": null,
        "amount" : null,
        "timestamp" : null,
        "foundIssues": []
    };

    var foundIndex = {};

    if (indexID) {
        foundIndex = await interactAdminErrorIndexSchema.findOne({ _id: indexID });
    } else {
        const currentIndexID = await getCurrentErrorIndex();
        foundIndex = await interactAdminErrorIndexSchema.findOne({ _id: currentIndexID });
    }

    if (!foundIndex || !foundIndex.errorIssues[0] || !foundIndex.errorIssues[0]) return searchErrorV2("R006", { userID: adminID });

    returnData.indexID = foundIndex._id;
    returnData.amount = foundIndex.errorIssues.length;
    returnData.timestamp = foundIndex.timestamp;
    if (foundIndex.nextIndexID) returnData.nextIndexID = foundIndex.nextIndexID;
    if (foundIndex.prevIndexID) returnData.prevIndexID = foundIndex.prevIndexID;

    for (const issue of foundIndex.errorIssues) {
        const issueID = issue._id;
        const foundIssue = await interactAdminErrorSchema.findOne({ _id: issueID });

        returnData.foundIssues.push(foundIssue);
    }

    return returnData;
}

/* gets a given error issue from DB */
async function findErrorIssue({ errorID, adminID }) {
    if (!errorID) return searchErrorV2("R001", { userID: adminID });
    if (!adminID) return searchErrorV2("R002", { userID: adminID });

    const isAdmin = await isUserAdmin({ userID: adminID })
    if (isAdmin.error) return isAdmin;

    const foundError = await interactAdminErrorSchema.findOne({ _id: errorID });
    if (!foundError) return searchErrorV2("R004", { userID: adminID});

    return foundError;
}

/* checks if user is admin ***TODO: to be updated */
async function isUserAdmin({ userID }) {
    /* will be updated to check once admin is complete */
    return true;

    // return searchErrorV2("R003", { userID });
}

module.exports = {
    resolveError,
    reviewError,
    findErrorIssue,
    getErrorIssues,
    overrideError
}
