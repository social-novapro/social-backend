const {v4 : uuidv4} = require('uuid');
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const { SCHEMA_VERSIONS } = require('../../../../../config.json');
const { checktime } = require('../../../checktime');

async function newDevAppToken() {
    const newID = uuidv4();
    return doubleCheckNewToken(newID);
};

async function doubleCheckNewToken(newID) {
    result = await developerAppToken.findOne({ _id: newID });
    if (result) return newDevAppToken();
    else return newID;
};

async function newDeveloperAppToken(userID, devToken) {
    const devAppToken = await newDevAppToken();
    const currentTime = checktime();

    await developerAppToken.findOneAndUpdate({
        _id: devAppToken
    }, {        
        _id: devAppToken,
        __v: SCHEMA_VERSIONS.developerAppToken,
        userID,
        devToken,
        APIUses: 0,
        creationTimestamp: currentTime,
    }, {
        upsert: true
    });

    return devAppToken;
};

module.exports = { newDeveloperAppToken };