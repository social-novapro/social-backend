const {v4 : uuidv4} = require('uuid');
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const { SCHEMA_VERSIONS } = require('../../../../../config.json');
const { checktime } = require('../../../checktime');
const { awardUserBadge } = require('../../../user/badges');
const { searchErrorV2 } = require('../../../searchError');

async function newDevAppToken() {
    const newID = uuidv4();
    return doubleCheckNewToken(newID);
};

async function doubleCheckNewToken(newID) {
    const result = await developerAppToken.findOne({ _id: newID });
    if (result) return newDevAppToken();
    else return newID;
};

function normalizeAppOrigin(origin) {
    if (origin == null) return null;
    if (typeof origin !== 'string') throw new Error('invalid_origin');

    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) return null;

    return new URL(trimmedOrigin).origin.replace(/\/+$/, '');
}

async function newDeveloperAppToken(userID, devToken, appName, origin=null) {
    const trimmedAppName = typeof appName === 'string' ? appName.trim() : null;
    if (!devToken || !trimmedAppName) return searchErrorV2("A011", { userID });

    const foundDevtoken = await developerToken.findOne({ _id: devToken });
    if (!foundDevtoken) return searchErrorV2("A002", { userID });
    if (foundDevtoken.userID != userID) return searchErrorV2("B003", { userID });

    const devAppToken = await newDevAppToken();
    const currentTime = checktime();
    let normalizedOrigin = null;
    try {
        normalizedOrigin = normalizeAppOrigin(origin);
    } catch {
        return searchErrorV2("A011", { userID });
    }

    await developerAppToken.findOneAndUpdate({
        _id: devAppToken
    }, {        
        _id: devAppToken,
        __v: SCHEMA_VERSIONS.developerAppToken,
        userID,
        devToken,
        appName: trimmedAppName,
        origin: normalizedOrigin,
        APIUses: 0,
        creationTimestamp: currentTime,
    }, {
        upsert: true
    });

    const newTokenData = await developerAppToken.findOne({ _id: devAppToken });
    if (!newTokenData) return searchErrorV2("A008", { userID });

    await awardUserBadge({ userID, badgeID: "apps_created" });
    return { data: newTokenData };
};

async function editDeveloperAppToken({ userID, appToken, newAppName, newAppOrigin }) {
    const trimmedAppName = typeof newAppName === 'string' ? newAppName.trim() : null;
    if (!appToken) return searchErrorV2("A011", { userID });

    const foundAppToken = await developerAppToken.findOne({ _id: appToken });
    if (!foundAppToken) return searchErrorV2("A002", { userID });

    const foundDevtoken = await developerToken.findOne({ _id: foundAppToken.devToken });
    if (!foundDevtoken) return searchErrorV2("A002", { userID });
    if (foundDevtoken.userID != userID) return searchErrorV2("B003", { userID });

    const isAppOriginProvided = typeof newAppOrigin === 'string' && newAppOrigin.trim() !== '';
    if (!trimmedAppName && !isAppOriginProvided) return searchErrorV2("A011", { userID });

    let normalizedOrigin = foundAppToken.origin;
    if (isAppOriginProvided) {
        try {
            normalizedOrigin = normalizeAppOrigin(newAppOrigin);
        } catch (err) {
            return searchErrorV2("A011", { userID });
        }
    }

    await developerAppToken.findOneAndUpdate({ _id: appToken }, {
        appName: trimmedAppName || foundAppToken.appName,
        origin: normalizedOrigin
    });

    const updatedToken = await developerAppToken.findOne({ _id: appToken });
    if (!updatedToken) return searchErrorV2("A008", { userID });

    return { data: updatedToken };
}

module.exports = {
    newDeveloperAppToken,
    editDeveloperAppToken,
    normalizeAppOrigin
};