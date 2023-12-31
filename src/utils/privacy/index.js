const interactPrivacySchema = require("../../schemas/user/interactPrivacySchema");
const { checktime } = require("../checktime");
const privacySettings = require("./settings.json")

function possiblePrivacySettings() {
    return privacySettings;
}

async function getPrivacySetting({ userID, privacy }) {
    const settings = await getUserDBSettings({ userID });
    if (!settings) return { error: "No privacy settings found" };
    return settings[privacy];
}

async function getUserDBSettings({ userID }) {
    const settings = await interactPrivacySchema.findOne({ _id: userID });
    if (!settings) {
        var toSet = {
            _id: userID,
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

async function setPrivacySettings({ userID, newSetting }) {
    const foundSettings = await getUserDBSettings({ userID });
    if (!foundSettings) return { error: "No settings found" };
    var changed = false;
    console.log(newSetting)

    //newSettings.forEach(newSetting => {
        foundChange = privacySettings.settings.find(setting => setting.dbTitle === newSetting.name);
        if (foundChange) {
            foundSettings[newSetting.name] = newSetting.value;
            changed = true;
        }
    //})


    if (!changed) return { error: "No settings changed" };
    await foundSettings.save();
    return getPrivacySettings({ userID });
}


async function getPrivacySettings({ userID }) {
    const foundSettings = await getUserDBSettings({ userID });
    if (!foundSettings) return { error: "No settings found" };
    const settings = [];

    privacySettings.settings.forEach(setting => {
        if (!setting) return console.log("No setting")
        const currentSetting = foundSettings[setting.dbTitle] ?? setting.default;
       
        const settingToPush = {
            title: setting.title, 
            description: setting.description,
            value: currentSetting,
            name: setting.dbTitle,
            options: []
        }

        setting.options.forEach(option => {
            if (!option) return console.log("No option")
            var foundOption = privacySettings.options.find(option_details => option.value === option_details.intTitle);
            if (!foundOption) return console.log("No found option")

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

module.exports = {
    getPrivacySetting,
    getPrivacySettings,
    setPrivacySettings
};