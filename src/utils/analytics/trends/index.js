const { v4: uuidv4 } = require('uuid');
const interactAnalyticUserSchema = require("../../../schemas/analytics/interactAnalyticUserSchema");
const { searchErrorV2 } = require('../../searchError');
const interactAnalyticUseRecordSchema = require('../../../schemas/analytics/interactAnalyticUseRecordSchema');
const { checktime } = require('../../checktime');
const interactAnalyticUseIndexSchema = require('../../../schemas/analytics/interactAnalyticUseIndexSchema');

// FIRST SAVE OF USER WILL GIVE USER MULTIPLE RECORDS

// save connection when someone opens api route
async function saveConnection({
    userID,
    url_base = "unknown",
    url_full = "unknown"
}) {
    // find user
    var user = await findAnalyticUser({ userID });
    if (!user) return searchErrorV2("V001", { userID })
    if (user.error) return user;

    const index = await getCurrentIndex({
        analyticUserID: user.analyticUserID,
        analyticUserData: user,
        makeIndex: true
    });

    console.log(index)

    // save connection
    const connectionID = uuidv4();
    await interactAnalyticUseRecordSchema.create({
        _id: connectionID,
        analyticUserID: user.analyticUserID,
        indexID: index._id,
        timestamp: checktime(),
        url_base,
        url_full
    });

    // update index 
    await interactAnalyticUseIndexSchema.findOneAndUpdate({
        _id: index._id
    }, {
        $inc: { count: 1 }
    });

    return { success: true };
}

// find id of user
async function findAnalyticUser({
    userID
}) {
    // if no userID, return unknown user
    if (!userID) {
        const unknownUser = await findAnalyticUser({ userID: 'unknown'});
        return unknownUser;
    }

    // find user by userID, and will work with unknown
    const userFound = await interactAnalyticUserSchema.findOne({ userID });
    if (userFound) return userFound;

    // user was not found
    // const userFoundAttempt = await interactAnalyticUserSchema.findOne({ _id: userID });
    // if (userFoundAttempt) return userFoundAttempt;
    const analyticUserID = uuidv4();

    // create user save
    await interactAnalyticUserSchema.create({
        _id: uuidv4(),
        userID,
        analyticUserID,
        timestamp: checktime()
    });

    const newUser = await interactAnalyticUserSchema.findOne({ userID });
    return newUser;    
}

// find user by analyticUserID
async function findAnalyticUserByAnalyticID({
    analyticUserID
}) {
    const userFound = await interactAnalyticUserSchema.findOne({ analyticUserID });
    if (!userFound) return searchErrorV2("V001", { userID: analyticUserID });
    return userFound;
}

// create new index for user
async function createNewIndex({
    analyticUserID
}) {
    // create new index
    const newIndexID = uuidv4();

    // get current user
    const user = await findAnalyticUserByAnalyticID({ analyticUserID });
    if (user.error) return user;

    // update previous index if one
    if (user.indexID) {
        await interactAnalyticUseIndexSchema.findOneAndUpdate({
            _id: user.indexID
        }, {
            current: false,
            nextIndexID: newIndexID
        });
    }
    // look for new index made previously
    const findIndex = await getCurrentIndex({ analyticUserID, makeIndex: false });
    if (findIndex) return findIndex;

    // create new index record
    const timestamp = checktime();
    await interactAnalyticUseIndexSchema.create({
        _id: newIndexID,
        timestamp,
        current: true,
        count: 0,
        analyticUserID,
        prevIndexID: user?.indexID ? user.indexID : null,
        nextIndexID: null
    });

    // update user index
    await interactAnalyticUserSchema.findOneAndUpdate({
        analyticUserID
    }, {
        indexID: newIndexID
    });

    // const userIndex = await getCurrentIndex({ analyticUserID, makeIndex: false });
    // return userIndex;
    return {
        _id: newIndexID,
        timestamp,
        current: true,
        count: 0,
        analyticUserID,
        prevIndexID: user?.indexID ? user.indexID : null,
        nextIndexID: null
    };
}

// get current index for user
async function getCurrentIndex({
    analyticUserID,
    analyticUserData = undefined,
    makeIndex = true
}) {
    
    if (!analyticUserData) analyticUserData = await findAnalyticUserByAnalyticID({ analyticUserID });
    const userIndex = await interactAnalyticUseIndexSchema.findOne({ 
        // UGH THIS ISNT GOOD, FIX IT
        _id: analyticUserData.indexID,
        analyticUserID,
        current: true
    });
    
    if ((!userIndex || userIndex.count > 100) && makeIndex) {
        const newIndex = await createNewIndex({ analyticUserID });
        return newIndex;
    }

    return userIndex;
}

// fix user connection data
// when user first loads, may create multiple analytic-user records
async function fixUserConnection({ userID }) {
    // go via indexCount:0 , then find users with same userID
    const foundRecords = await interactAnalyticUserSchema.find({ userID });
    if (foundRecords.length <= 1) return { success: true };

    const killList = [];
    const keepList = [];

    for (const record of foundRecords) {
        if (record.count == 0) {
            killList.push(record.analyticUserID);
        } else {
            keepList.push(record.analyticUserID);
        }
    }
    
    if (keepList.length == 0) return searchErrorV2("V003", { userID });
    if (killList.length == 0) return { success: true };

    const mainAnalyticUserID = keepList[0];
    for (const keepID of keepList) {
        if (keepID == mainAnalyticUserID) continue;
        killList.push(keepID);
    }

    const foundRecord = await interactAnalyticUserSchema.findOne({ analyticUserID: mainAnalyticUserID });
    
    for (const killID of killList) {
        const userIndex = await interactAnalyticUseIndexSchema.interactAnalyticUseIndexSchema({ analyticUserID: killID });
        // if (userIndex && userIndex.) {
            
        // }
        const foundConnections = await interactAnalyticUseRecordSchema.find({ analyticUserID: killID });
        // move connection to good index


    }
}

module.exports = {
    saveConnection,
}