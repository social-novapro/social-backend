const interactEmailSettingSchema = require("../../../schemas/emails/interactEmailSettingSchema");
const { searchError } = require("../../searchError");

async function settings({ userID, options }) {
    // options = [ { option: "notifications", value: true }]
    const foundSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundSettings) return searchError("N010");

    const possibleOptions = [
        "notifications",
        "emailSub",
        "emailNewsLetter",
        "emailAlerts",
        "emailReplies",
        "emailMentions",
    ]

    var foundOption = false;
    var foundOptions = {};

    for (const option of options) {
        if (!possibleOptions.includes(option.option)) continue;
        foundOption = true;
        foundOptions[option.option] = option.value;

    }

    if (!foundOption) return searchError("N025");

    await interactEmailSettingSchema.findOneAndUpdate(
        { _id: userID },
        {
            notifications: foundOptions.notifications ? foundOptions.notifications : foundSettings.notifications,
            emailSub: foundOptions.emailSub ? foundOptions.emailSub : foundSettings.emailSub,
            emailNewsLetter: foundOptions.emailNewsLetter ? foundOptions.emailNewsLetter : foundSettings.emailNewsLetter,
            emailAlerts: foundOptions.emailAlerts ? foundOptions.emailAlerts : foundSettings.emailAlerts,
            emailReplies: foundOptions.emailReplies ? foundOptions.emailReplies : foundSettings.emailReplies,
            emailMentions: foundOptions.emailMentions ? foundOptions.emailMentions : foundSettings.emailMentions,
        },
        { upsert: true }
    );

    const updatedSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    return updatedSettings;
}

module.exports = { settings };