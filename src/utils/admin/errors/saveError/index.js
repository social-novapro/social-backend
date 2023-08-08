const interactAdminErrorSchema = require("../../../../schemas/admin/interactAdminErrorSchema");
const interactAdminErrorIndexSchema = require("../../../../schemas/admin/interactAdminErrorIndexSchema");
const { v4: uuidv4 } = require("uuid");
const { checktime } = require("../../../checktime");
const { getCurrentErrorIndex, setCurrentErrorIndex } = require("../../indexesAdmin");

/* saves error to the db */
async function saveErrorToDB({ errorCode, errorMsg, userID }) {
    const errorID = uuidv4();

    await interactAdminErrorSchema.create({
        _id: errorID,
        userID: userID || "unknown",
        timestamp: checktime(),
        errorCode,
        errorMsg,

        resolved: false,
        resolvedTimestamp: null,

        inReview: false,
        reviewedBy: null,
        reviewedTimestamp: null
    });

    await addToIndex({ errorID });

    return errorID;
}

/* creates new index for errors */
async function createIndex({ prevIndexID }) {
    const indexID = uuidv4();

    await interactAdminErrorIndexSchema.create({
        _id: indexID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null
    })

    await setCurrentErrorIndex({ indexID });
    return indexID;
}

/* adds an error to an index */
async function addToIndex({ errorID }) {
    const indexID = await getCurrentErrorIndex();
    var usedIndexID;

    // creates index
    if (!indexID) usedIndexID = await createIndex({ prevIndexID: null });

    // finds the index for its data
    var foundIndex = await interactAdminErrorIndexSchema.findOne({ _id: indexID });
    
    // no index was found OR amount is over 50
    if (!foundIndex || foundIndex.errorIssues?.length >= 50) {
        const newIndexID = await createIndex({ prevIndexID: foundIndex?._id ? foundIndex._id : null });
        usedIndexID = newIndexID;

        // finds the index
        foundIndex = await interactAdminErrorIndexSchema.findOne({ _id: indexID });
    } else {
        usedIndexID = foundIndex._id;
    }

    await interactAdminErrorIndexSchema.findOneAndUpdate({ 
        _id: usedIndexID 
    },{ 
        amount: foundIndex.amount+1,
        $push : { "errorIssues" : {
            _id: errorID
        }}
    })

    return usedIndexID;
}

module.exports = { saveErrorToDB };