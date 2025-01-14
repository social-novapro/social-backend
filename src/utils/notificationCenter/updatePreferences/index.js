const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const notif_types = require('../notif_types.json');
const { checktime } = require('../../checktime');
const interactNotificationCenterPreferenceSchema = require('../../../schemas/notificationCenter/interactNotificationCenterPreferenceSchema');
const { v4: uuidv4 } = require('uuid');
const { searchErrorV2 } = require('../../searchError');
const deviceSystemCount = notif_types.systems.length;

/* reformat the preference for easier use, and suplly for frontend */
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

/* reformat system types for easier use, and supply for frontend */
function reformatSystemTypes(systemType) {
    const verified = verifySystemTypeInput(systemType);
    if (verified.error) return verified;

    const systemDevice = notif_types.systems[systemType-1]; // -1 because systemType is 1-indexed
    if (!systemDevice || (!systemDevice.id == systemType)) return searchErrorV2("L025", { systemType });

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

/* make sure the notifType is allowed for the systemType */
function verifyNotifTypeWithSystemType(notifType, systemType) {
    if (!notifType) return searchErrorV2("L035", { userID: "Unrelated" });
    if (!notifType.systemTypes || notifType.systemTypes.length === 0) return true;
    if (notifType.systemTypes.includes(systemType)) return true;

    return searchErrorV2("L034", { userID: "Unrelated" })
}

/* gets a single type of notification */
async function getNotifType({ typeID }) {
    const found = await interactNotificationCenterTypeSchema.findOne({ _id: typeID });
    return found;
}

/* gets all types of notifications */
async function getNotifTypes() {
    const types = await interactNotificationCenterTypeSchema.find();
    types.sort((a, b) => a._id - b._id);
    return types;
}

/* gets all preferences for a user, of a system Type */
async function getNotifPreferences({ userID, systemType }) {
    const preferences = await interactNotificationCenterPreferenceSchema.find({ 
        userID,
        systemType: systemType
    });
    preferences.sort((a, b) => a.type - b.type);
    return preferences;
}

/* gets a single preference for a user */
async function getNotifPreference({ userID, typeID, systemType }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) return searchErrorV2("L020", { userID });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (!systemTypeCheck || systemTypeCheck.error) return systemTypeCheck;
 
    const preference = await interactNotificationCenterPreferenceSchema.findOne({ 
        userID,
        type: typeID,
        systemType
    });
    
    return preference;
}

/* initalizes all preferences for a user */
// TODO: is this not being used at all??
async function initalizePreferences({ userID }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
    const preferences = [];

    for (let i = 0; i < deviceSystemCount; i++) {
        const systemPreferences = await getNotifData({ userID, systemType: i+1 });
        preferences.push(systemPreferences);
    }

    return preferences;
}

/* sets a single preference, makes sure its allowed */
async function setPreference({ userID, systemType, enabled, typeID, setDefault }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) return searchErrorV2("L020", { userID });
    if (enabled === undefined && !setDefault) return searchErrorV2("L026", { userID });
    
    if (enabled==true) enabled = 1;
    if (enabled==false) enabled = 0;
    if (enabled !== 0 && enabled !== 1) return searchErrorV2("L027", { userID });
    
    // make sure systemType is valid
    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    // make sure typeID is part of systemType
    const notifType = await getNotifType({ typeID });
    const verified = verifyNotifTypeWithSystemType(notifType, systemType);
    if (verified.error) return verified;

    // make sure it can change
    if (notifType.required) return searchErrorV2("L028", { userID });

    // get previous preference
    const foundPref = await getNotifPreference({ typeID, userID, systemType });
    if (foundPref) {
        foundPref.enabled = enabled;
        foundPref.timestampUpdated = checktime();
        await foundPref.save();
        return foundPref;
    }
    
    // set default value if not set or provided
    if (enabled === undefined && setDefault == true) notifType.esstential ? enabled = notifType.esstential : enabled = 0; // TODO: maybe look for default

    // create new preference
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

/* gets a single preference of given systemType */
async function getNotifDataType({ userID, typeID, systemType }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) return searchErrorV2("L020", { userID });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const ncPref = await getNotifPreference({ userID, typeID, systemType });

    const ncType = await getNotifType({ typeID });

    if (!ncType) return searchErrorV2("L021", { userID });
    if (!ncPref) return searchErrorV2("L022", { userID });

    return reformatTypePref(ncPref, ncType);
}

async function getAllNotifPreferences({ userID }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });

    const notificationSystemPreferences = [];
    for (let i = 0; i < deviceSystemCount; i++) {
        const preferences = await getNotifData({ userID, systemType: i+1 });
        notificationSystemPreferences.push({ preferences, system: reformatSystemTypes(i+1)});
    }

    return {systemPreferences: notificationSystemPreferences, sectionTypes: notif_types.sectionTypes};
}

/* gets all notif preferences of a given type, and creates a new one if not set*/
async function getNotifData({ userID, systemType }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const types = await getNotifTypes();
    const foundPreferences = await getNotifPreferences({ userID, systemType });

    const userPreferences = [];
    for (let i = 0; i < types.length; i++) {
        // make sure typeID is part of systemType
        const verified = verifyNotifTypeWithSystemType(types[i], systemType);
        if (verified.error) continue; // will skip if not part of it
        
        const setType = {...types[i]._doc};
        const foundPref = foundPreferences.find(preference => preference.type === setType._id);
        const sectionTypeID = getIndexFromNumber(types[i].id);
        
        if (foundPref) {
            userPreferences.push({ setting: reformatTypePref(foundPref, setType), sectionId: sectionTypeID });
        } else {
            const newPref = await setPreference({ userID, systemType, enabled: 0, typeID: setType._id });
            userPreferences.push({ setting: reformatTypePref(newPref, setType), sectionTypeID });
        }
    }
    
    return userPreferences;
}

/* thanks copliot, --update, actually fuck you, you half worked  */
function getIndexFromNumber(number) {
    // Convert the number to a string
    let numberStr = number.toString();
    let truncatedStr = numberStr.slice(0, -2);
    console.log(number, truncatedStr)
    if (truncatedStr === '') return 0
    else return parseInt(truncatedStr);
}

/* changes multiple preferences at once */
async function setNotifPreferences({ userID, systemType, changes }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
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

/* st a single preference, from the api route */
async function setNotifPreference({ userID, systemType, typeID, enabled }) {
    if (!userID) return searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) return searchErrorV2("L020", { userID });
    if (enabled === undefined) return searchErrorV2("L026", { userID });

    const systemTypeCheck = verifySystemTypeInput(systemType);
    if (systemTypeCheck.error) return systemTypeCheck;

    const update = await setPreference({
        userID,
        systemType,
        enabled,
        typeID
    });
    
    return update;
}

async function setNotifData({ userID }) {
    // const types = await getNotifTypes();

}

module.exports = {
    getAllNotifPreferences,
    getNotifData,
    getNotifDataType,
    getNotifPreference,
    setNotifPreferences,
    setNotifPreference,
    initalizePreferences
};