const {v4 : uuidv4} = require('uuid');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema/');
const { SCHEMA_VERSIONS } = require('../../../../../config.json');
const { checktime } = require('../../../checktime');

async function newDevToken() {
    const newID = uuidv4();
    return doubleCheckNewToken(newID);
};

async function doubleCheckNewToken(newID) {
    result = await developerToken.findOne({ _id: newID });
    if (result) return newDevToken();
    else return newID;
};

async function newDeveloperToken(userID) {
    const devToken = await newDevToken();
    const currentTime = checktime();

    await developerToken.findOneAndUpdate({
        _id: devToken
    }, {        
        _id: devToken,
        __v: SCHEMA_VERSIONS.developerToken,
        creationTimestamp: currentTime,
        userID,
        premium: false,
        APIuses: 0
    }, {
        upsert: true
    });

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, { devToken });
    
    return devToken;
};

module.exports = { newDeveloperToken };