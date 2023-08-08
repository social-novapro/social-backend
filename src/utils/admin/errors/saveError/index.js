const interactAdminErrorSchema = require("../../../../schemas/admin/interactAdminErrorSchema");
const interactAdminErrorIndexSchema = require("../../../../schemas/admin/interactAdminErrorIndexSchema");
const { v4: uuidv4 } = require("uuid");
const { checktime } = require("../../../checktime");
const { getCurrentErrorIndex, setCurrentErrorIndex } = require("../../indexesAdmin");

var currentCount = 0;
var currentIndex = null;
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

    console.log("currentIndexID " + currentIndexID + " count " + currentCount);
    // no set index
    if (!currentIndexID || !currentIndex) {
        currentIndexID = await getCurrentErrorIndex();
        
        // creates new if no indexID, 
        if (!currentIndexID) currentIndexID = await createIndex({ prevIndexID: null });
        
        currentIndex = await interactAdminErrorIndexSchema.findOne({ _id: currentIndexID})
        currentCount = currentIndex.amount;
    }

    // array to long
    if (currentCount >= 50) {
        currentIndexID = await createIndex({ prevIndexID: currentIndex?._id ? currentIndex._id : null });
        currentIndex = await interactAdminErrorIndexSchema.findOne({ _id: currentIndexID });
        currentCount = 0;
    }

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