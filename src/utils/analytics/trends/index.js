const { v4: uuidv4 } = require('uuid');
const interactAnalyticUserSchema = require("../../../schemas/analytics/interactAnalyticUserSchema");
const { searchErrorV2 } = require('../../searchError');
const interactAnalyticUseRecordSchema = require('../../../schemas/analytics/interactAnalyticUseRecordSchema');

// save connection when someone opens api route
async function saveConnection({
    userID,
    url_base,
    url_full
}) {
    // find user
    const user = await findAnalyticUser({ userID });
    if (!user) return searchErrorV2("V001", { userID })

    await interactAnalyticUseRecordSchema.create({
        _id: uuidv4(),
        analyticUserID: user.analyticUserID,
        indexID: user.indexID,
        timestamp: getTime(),
        url_base,
        url_full
    });
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
    const userFound = await interactAnalyticUserSchema.findOne({ _id: userID });
    if (userFound) return userFound;

    await interactAnalyticUserSchema.create({
        _id: userID,
        analyticUserID: uuidv4(),
    });

    const newUser = await interactAnalyticUserSchema.findOne({ _id: userID });
    return newUser;    
}
