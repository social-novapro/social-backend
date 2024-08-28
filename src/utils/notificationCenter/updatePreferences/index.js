const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const notif_types = require('../notif_types.json');
const { checktime } = require('../../checktime');
const interactNotificationCenterPreferenceSchema = require('../../../schemas/notificationCenter/interactNotificationCenterPreferenceSchema');
const { v4: uuidv4 } = require('uuid');
const { searchErrorV2 } = require('../../searchError');
const deviceSystemCount = notif_types.systems.length;

function reformatTypePref(ncPreference, ncType) {
    return {
        type: ncPreference.type,
        name: ncType.name,
        description: ncType.description,
        enabled: ncPreference.enabled,
        timestamp: ncPreference.timestamp,
        timestampUpdated: ncPreference.timestampUpdated,
        systemType: ncPreference.systemType
    };
}

function reformatSystemTypes(systemType) {
    const verified = verifySystemTypeInput(systemType);
    if (verified.error) return verified;

    const systemDevice = notif_types.systems[systemType-1]; // -1 because systemType is 1-indexed
    if (!systemDevice || (!systemDevice.id == systemType)) searchErrorV2("L025", { systemType });

    return {
        systemType: systemDevice.id,
        name: systemDevice.name,
        description: systemDevice.description,
    };
}

/* quickly make sure the systemType is valid, shared between multiple functions */
function verifySystemTypeInput(systemType) {
    if (systemType === undefined) {
        return {error: 'No device type provided'};
    }
    if (systemType <= 0 || systemType > deviceSystemCount) {
        return {error: 'Invalid device type'};
    }
    return true;
}

async function getNotifType({ typeID }) {
    const found = await interactNotificationCenterTypeSchema.findOne({ _id: typeID });
    return found;
}

async function getNotifTypes() {
    const types = await interactNotificationCenterTypeSchema.find();
    return types;
}

async function getPreferences({ userID, systemType }) {
    const preferences = await interactNotificationCenterPreferenceSchema.find({ 
        userID,
        systemType: systemType
    });
    
    return preferences;
}

async function getPreference({ userID, typeID, systemType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });
    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;
 
    const preferences = await interactNotificationCenterPreferenceSchema.findOne({ 
        userID,
        type: typeID,
        systemType
    });
    
    return preferences;
}

async function setPreference({ userID, systemType, enabled, typeID }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });
    if (enabled === undefined) searchErrorV2("L026", { userID });
    
    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const foundPref = await getPreference({ typeID, userID, systemType });
    if (foundPref) {
        foundPref.enabled = enabled;
        foundPref.timestampUpdated = checktime();
        await foundPref.save();
        return foundPref;
    }
    else {
        const newPreference = await interactNotificationCenterPreferenceSchema.create({
            _id: uuidv4(),
            type: typeID,
            enabled,
            userID,
            timestamp: checktime(),
            timestampUpdated: checktime(),
            systemType,
        });

        return newPreference;
    }
}

async function getNotifDataType({ userID, typeID, systemType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const ncPref = await getPreference({ userID, typeID, systemType });
    const ncType = await getNotifType({ typeID });

    if (!ncType) searchErrorV2("L021", { userID });
    if (!ncPref) searchErrorV2("L022", { userID });

    return reformatTypePref(ncPref, ncType);
}

async function getAllNotifPreferences({ userID }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });

    const notificationSystemPreferences = [];
    for (let i = 0; i < deviceSystemCount; i++) {
        const preferences = await getPreferences({ userID, systemType: i+1 });
        notificationSystemPreferences.push({preferences, system: reformatSystemTypes(i+1)});
    }

    return notificationSystemPreferences;
}

async function getNotifData({ userID, systemType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const types = await getNotifTypes();
    const setPreferences = await getPreferences({ userID, systemType });

    const userPreferences = [];
    for (let i = 0; i < types.length; i++) {
        const setType = {...types[i]._doc};
        const foundPref = setPreferences.find(preference => preference.type === setType._id);

        if (foundPref) {
            userPreferences.push(reformatTypePref(foundPref, setType));
        } else {
            const newPref = await setPreference({ userID, systemType, enabled: 0, typeID: setType._id });
            userPreferences.push(reformatTypePref(newPref, setType));
        }
    }
    
    return {
        userPreferences,
        sectionTypes: notif_types.sectionTypes,
    }; 
}

async function setNotifPreferences({ userID, systemType, changes }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!changes || changes.length === 0) return searchErrorV2("L024", { userID });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const updates = [];

    for (const change of changes) {
        const update = await setPreference({
            userID,
            systemType,
            enabled: change.enabled,
            typeID: change.typeID
        });
        updates.push(update);
    }

    return getNotifData({ userID, systemType });
}

async function setNotifPreference({ userID, systemType, typeID, enabled }) {

    
}

async function setNotifData({ userID }) {
    // const types = await getNotifTypes();

}

module.exports = {
    getAllNotifPreferences,
    getNotifData,
    getNotifDataType,
    setNotifPreferences,
    setNotifPreference,
};