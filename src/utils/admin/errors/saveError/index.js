const interactAdminErrorSchema = require("../../../../schemas/admin/interactAdminErrorSchema");
const interactAdminErrorIndexSchema = require("../../../../schemas/admin/interactAdminErrorIndexSchema");
const { v4: uuidv4 } = require("uuid");
const { checktime } = require("../../../checktime");
const { getCurrentErrorIndex, setCurrentErrorIndex } = require("../../indexesAdmin");

/* these must always be set */
var currentCount = 0;
var currentIndex = null;
/* pretty sure this does not matter, but ill keep it, cause it works */
var currentIndexID = null;

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

    // manages varibles to be used by rest of file
    currentCount = 0;
    currentIndexID = indexID;
    
    await interactAdminErrorIndexSchema.create({
        _id: indexID,
        timestamp: checktime(),
        amount: 0,
        prevIndexID: prevIndexID ? prevIndexID : null
    })

    if (prevIndexID) {
        await interactAdminErrorIndexSchema.findOneAndUpdate({
            _id: prevIndexID
        }, {
            nextIndexID: indexID
        })
    }

    await setCurrentErrorIndex({ indexID });
    
    return indexID;
}

/* adds an error to an index */
async function addToIndex({ errorID }) {
    // no set index
    if (!currentIndexID || !currentIndex) {
        currentIndexID = await getCurrentErrorIndex();
        
        // creates new if no indexID, 
        if (!currentIndexID) await createIndex({ prevIndexID: null });
        else {
            currentIndex = await interactAdminErrorIndexSchema.findOne({ _id: currentIndexID})
            currentCount = currentIndex.amount;
        }
    }

    // array to long
    if (currentCount >= 50) {
        await createIndex({ prevIndexID: currentIndexID ? currentIndexID : null });
    }

    // manages the count
    currentCount++;

    // saves to DB
    await interactAdminErrorIndexSchema.findOneAndUpdate({ 
        _id: currentIndexID 
    },{ 
        amount: currentCount,
        $push : { "errorIssues" : {
            _id: errorID
        }}
    })

    return currentIndexID;
}

module.exports = { saveErrorToDB };