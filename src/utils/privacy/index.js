const interactPrivacySchema = require("../../schemas/user/interactPrivacySchema");
const { checktime } = require("../checktime");
const { searchErrorV2 } = require('../searchError');

const privacySettings = require("./settings.json")

function findFullDetailByDbTitle(dbTitle) {
    const setting = findSettingByDbTitle(dbTitle);

    const settingToPush = {
        title: setting.title, 
        description: setting.description,
        name: setting.dbTitle,
        defaultValue: setting.default,
        options: [],
        allowed: setting.options.map(option => option.value)
    }

    // for (const option of foundSetting.options) {
    setting.options.forEach(option => {
        if (!option) return searchErrorV2("T009", { userID })
        var foundOption = privacySettings.options.find(option_details => option.value === option_details.intTitle);
        if (!foundOption) return searchErrorV2("T010", { userID })

        settingToPush.options.push({
            title: foundOption.title,
            value: foundOption.intTitle,
            description: 
                option.description ? foundOption['description_' + option.description].replace("{{title}}", setting.shortTitle) :
                foundOption.description.replace("{{title}}", setting.shortTitle),
        })
    });
    // return {
    //     option
    // }
    return settingToPush;
}

function findSettingByDbTitle(dbTitle) {
    return privacySettings.settings.find(item => item.dbTitle === dbTitle);
}

/**
    gets single privacy setting for use for outside functions.
*/
async function getPrivacySetting({ userID, privacy }) {
    if (!userID) return searchErrorV2("T001", { userID });
    const settings = await getUserDBSettings({ userID });
    if (!settings) return searchErrorV2("T011", { userID });

    if (!settings[privacy] && settings[privacy] !== 0) {
        const defaultValue = findSettingByDbTitle(privacy).default;
        await setPrivacySetting({ userID, newSetting: { name: privacy, value: defaultValue }})
        return defaultValue;
    } 

    return settings[privacy];
}

/**
 * gets all privacy settings for a user in an array
 */
async function getUserDBSettings({ userID }) {
    if (!userID) return searchErrorV2("T001", { userID });
    const settings = await interactPrivacySchema.findOne({ _id: userID });
    if (!settings) {
        var toSet = {
            _id: userID ,
            timestamp: checktime(),
            edited: checktime(),
        }
        for (const setting of privacySettings.settings) {
            toSet[setting.dbTitle] = setting.default;
        }

        const newSettings = await interactPrivacySchema.create(toSet);
        return newSettings;
    }

    return settings;
}

/**
 * takes in an array to set privacy settings for a user
 */
async function setPrivacySettings({ userID, newSettings }) {
    if (!newSettings || !newSettings[0]) return searchErrorV2("T002", { userID });
    for (const newSetting of newSettings) {
        await setPrivacySetting({ userID, newSetting });
    }

    const foundSettings = await getPrivacySettings({ userID });
    return foundSettings;
}

/**
 * sets a single privacy setting for a user
 * newSetting = { name, value }
 */
async function setPrivacySetting({ userID, newSetting }) {
    if (!userID) return searchErrorV2("T001", { userID });
    const foundSettings = await getUserDBSettings({ userID });
    if (!foundSettings || foundSettings.error) return searchErrorV2("T003", { userID });
    var changed = false;

    foundChange = privacySettings.settings.find(setting => setting.dbTitle === newSetting.name);
    if (foundChange) {
        possibleChange = foundChange.options.find(option => option.value == newSetting.value);
        if (!possibleChange) return searchErrorV2("T004");
        await interactPrivacySchema.findOneAndUpdate({ _id: userID }, { [newSetting.name]: newSetting.value });
        changed = true;
    }

    if (!changed) return searchErrorV2("T005", { userID });
    return true;
}

/**
 * gets all privacy settings for a user
 */
async function getPrivacySettings({ userID }) {
    if (!userID) return searchErrorV2("T001", { userID });
    const foundSettings = await getUserDBSettings({ userID });
    if (!foundSettings || foundSettings.error) return searchErrorV2("T003", { userID });
    const settings = [];

    privacySettings.settings.forEach(setting => {
        if (!setting) return searchErrorV2("T012", { userID })
        const currentSetting = foundSettings[setting.dbTitle] ?? setting.default;
       
        const settingToPush = {
            title: setting.title, 
            description: setting.description,
            value: currentSetting,
            name: setting.dbTitle,
            options: []
        }

        setting.options.forEach(option => {
            if (!option) return searchErrorV2("T009", { userID })
            var foundOption = privacySettings.options.find(option_details => option.value === option_details.intTitle);
            if (!foundOption) return searchErrorV2("T010", { userID })

            settingToPush.options.push({
                title: foundOption.title,
                value: foundOption.intTitle,
                isActive: option.value === currentSetting,
                description: 
                    option.description ? foundOption['description_' + option.description].replace("{{title}}", setting.shortTitle) :
                    foundOption.description.replace("{{title}}", setting.shortTitle),
            })
        })

        settings.push(settingToPush);
    })

    return settings;
}

/**
 * checks if a privacy option is valid for other options
 */
function validPrivacyOption(userID, privacyNum, privacyType) {
    if (
        privacyNum < 0 || 
        privacyNum > privacySettings.amountOptions
    ) return searchErrorV2("T006", { userID });

    const foundPrivacy = privacySettings.settings.find(setting => setting.dbTitle === privacyType);
    if (!foundPrivacy) return searchErrorV2("T007", { userID });

    const foundOption = foundPrivacy.options.find(option => option.value == privacyNum);
    if (!foundOption) return searchErrorV2("T008", { userID });

    return true;
}

module.exports = {
    getPrivacySetting,
    getPrivacySettings,
    setPrivacySettings,
    setPrivacySetting,
    validPrivacyOption,
    findFullDetailByDbTitle
};