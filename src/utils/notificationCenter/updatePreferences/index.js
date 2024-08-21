const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const notif_types = require('../notif_types.json');
const { checktime } = require('../../checktime');
const interactNotificationCenterPreferenceSchema = require('../../../schemas/notificationCenter/interactNotificationCenterPreferenceSchema');
const { v4: uuidv4 } = require('uuid');

function reformatTypePref(ncPreference, ncType) {
    return {
        type: ncPreference.type,
        name: ncType.name,
        description: ncType.description,
        enabled: ncPreference.enabled,
        timestamp: ncPreference.timestamp,
        timestampUpdated: ncPreference.timestampUpdated,
    };
}

async function getNotifType({ typeID }) {
    const found = await interactNotificationCenterTypeSchema.findOne({ _id: typeID });
    return found;
}

async function getNotifTypes() {
    const types = await interactNotificationCenterTypeSchema.find();
    return types;
}

async function getPreferences({ userID, deviceType, deviceUUID }) {
    const preferences = await interactNotificationCenterPreferenceSchema.find({ 
        userID,
        deviceType: deviceType,
        deviceUUID: deviceUUID ? deviceUUID : null
    });
    
    return preferences;
}

async function getPreference({ typeID, userID, deviceType, deviceUUID }) {
    const preferences = await interactNotificationCenterPreferenceSchema.findOne({ 
        userID,
        type: typeID,
        deviceType: deviceType,
        deviceUUID: deviceUUID ? deviceUUID : null
    });
    
    return preferences;
}

async function setPreference({ userID, deviceType, deviceUUID, enabled, typeID }) {
    const foundPref = await getPreference({ typeID, userID, deviceType, deviceUUID });
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
            deviceUUID,
            deviceType,
        });

        return newPreference;
    }
}

async function getNotifDataType({ userID, typeID }) {
    const ncPref = await getPreference({ userID, typeID, deviceType: 0, deviceUUID: null });
    const ncType = await getNotifType({ typeID });

    if (!ncType) {
        return {error: 'Not found'};
    }
    if (!ncPref) {
        return {error: 'Not set'};
    }
    console.log(ncPref)
    console.log(ncType)
    return reformatTypePref(ncPref, ncType);
}

async function getNotifData({ userID }) {
    const types = await getNotifTypes();
    const setPreferences = await getPreferences({ userID, deviceType: 0, deviceUUID: null });

    const userPreferences = [];
    for (let i = 0; i < types.length; i++) {
        const setType = {...types[i]._doc};
        const foundPref = setPreferences.find(preference => preference.type === setType._id);

        if (foundPref) {
            userPreferences.push(reformatTypePref(foundPref, setType));
        } else {
            const newPref = await setPreference({ userID, deviceType: 0, deviceUUID: null, enabled: 0, typeID: setType._id });
            userPreferences.push(reformatTypePref(newPref, setType));
        }
    }
    
    return {
        userPreferences,
        sectionTypes: notif_types.sectionTypes,
    }; 
}

async function setNotifData({ userID }) {
    const types = await getNotifTypes();

}

module.exports = {
    getNotifData,
    getNotifDataType
};