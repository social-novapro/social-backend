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
        deviceType: ncPreference.deviceType
    };
}

function reformatSystemTypes(deviceType) {
    const verified = verifyDeviceTypeInput(deviceType);
    if (verified.error) return verified;

    const systemDevice = notif_types.systems[deviceType-1]; // -1 because deviceType is 1-indexed
    if (!systemDevice || (!systemDevice.id == deviceType)) searchErrorV2("L025", { deviceType });

    return {
        deviceType: systemDevice.id,
        name: systemDevice.name,
        description: systemDevice.description,
    };
}

/* quickly make sure the deviceType is valid, shared between multiple functions */
function verifyDeviceTypeInput(deviceType) {
    if (deviceType === undefined) {
        return {error: 'No device type provided'};
    }
    if (deviceType <= 0 || deviceType > deviceSystemCount) {
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

async function getPreferences({ userID, deviceType }) {
    const preferences = await interactNotificationCenterPreferenceSchema.find({ 
        userID,
        deviceType: deviceType
    });
    
    return preferences;
}

async function getPreference({ userID, typeID, deviceType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });
    const deviceTypeCheck = verifyDeviceTypeInput(deviceType);
    if (deviceTypeCheck.error) return deviceTypeCheck;
 
    const preferences = await interactNotificationCenterPreferenceSchema.findOne({ 
        userID,
        type: typeID,
        deviceType
    });
    
    return preferences;
}

async function setPreference({ userID, deviceType, enabled, typeID }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });
    if (enabled === undefined) searchErrorV2("L026", { userID });
    
    const deviceTypeCheck = verifyDeviceTypeInput(deviceType);
    if (deviceTypeCheck.error) return deviceTypeCheck;

    const foundPref = await getPreference({ typeID, userID, deviceType });
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
            deviceType,
        });

        return newPreference;
    }
}

async function getNotifDataType({ userID, typeID, deviceType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!typeID) searchErrorV2("L020", { userID });

    const deviceTypeCheck = verifyDeviceTypeInput(deviceType);
    if (deviceTypeCheck.error) return deviceTypeCheck;

    const ncPref = await getPreference({ userID, typeID, deviceType });
    const ncType = await getNotifType({ typeID });

    if (!ncType) searchErrorV2("L021", { userID });
    if (!ncPref) searchErrorV2("L022", { userID });

    console.log(ncPref)
    console.log(ncType)
    return reformatTypePref(ncPref, ncType);
}

async function getAllNotifPreferences({ userID }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });

    const notificationSystemPreferences = [];
    for (let i = 0; i < deviceSystemCount; i++) {
        const preferences = await getPreferences({ userID, deviceType: i+1 });
        notificationSystemPreferences.push({preferences, system: reformatSystemTypes(i+1)});
    }

    return notificationSystemPreferences;
}

async function getNotifData({ userID, deviceType }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });

    const deviceTypeCheck = verifyDeviceTypeInput(deviceType);
    if (deviceTypeCheck.error) return deviceTypeCheck;

    const types = await getNotifTypes();
    const setPreferences = await getPreferences({ userID, deviceType });

    const userPreferences = [];
    for (let i = 0; i < types.length; i++) {
        const setType = {...types[i]._doc};
        const foundPref = setPreferences.find(preference => preference.type === setType._id);

        if (foundPref) {
            userPreferences.push(reformatTypePref(foundPref, setType));
        } else {
            const newPref = await setPreference({ userID, deviceType, enabled: 0, typeID: setType._id });
            userPreferences.push(reformatTypePref(newPref, setType));
        }
    }
    
    return {
        userPreferences,
        sectionTypes: notif_types.sectionTypes,
    }; 
}

async function setNotifPreferences({ userID, deviceType, changes }) {
    if (!userID) searchErrorV2("L023", { userID: 'unknown' });
    if (!changes || changes.length === 0) return searchErrorV2("L024", { userID });

    const deviceTypeCheck = verifyDeviceTypeInput(deviceType);
    if (deviceTypeCheck.error) return deviceTypeCheck;

    const updates = [];
    // console.log(changes)

    for (const change of changes) {
        const update = await setPreference({
            userID,
            deviceType,
            enabled: change.enabled,
            typeID: change.typeID
        });
        updates.push(update);
    }
    // console.log(updates)
    return getNotifData({ userID, deviceType });
}

async function setNotifPreference({ userID, deviceType, typeID, enabled }) {

    
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