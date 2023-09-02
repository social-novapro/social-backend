const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require("../../../schemas/emails/interactEmailSettingSchema");
const { searchErrorV2 } = require("../../searchError");

const possibleOptions = [
    { name: "Notifications", option: "notifications", description: "Receive notifications" },
    { name: "News Letter", option: "emailNewsLetter", description: "Receive emails when there is a new newsletter" },
    { name: "Alerts", option: "emailAlerts", description: "Receive emails when there is a new alert" },
    { name: "Subscriptions", option: "emailSub", description: "Receive emails when someone you subscribed posts" },
    { name: "Replies", option: "emailReplies", description: "Receive emails when someone replies to your post" },
    { name: "Mentions", option: "emailMentions", description: "Receive emails when someone mentions you in a post" }
];

const possibleSettings = [
    "notifications",
    "emailSub",
    "emailNewsLetter",
    "emailAlerts",
    "emailReplies",
    "emailMentions",
]

async function settings({ userID, options }) {
    // options = [ { option: "notifications", value: true }]
    const foundVerification = await interactEmailVerificationSchema.findOne({ userID: userID });
    if (!foundVerification) return searchErrorV2("N027", { userID })

    const foundSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundSettings) return searchErrorV2("N010", { userID });

    var foundOption = false;
    var foundOptions = {};
    var validOptions = {};
    
    for (const option of options) {
        if (!possibleSettings.includes(option.option)) continue;
        foundOption = true;
        foundOptions[option.option] = option.value;
        validOptions[option.option] = true;
    }

    if (!foundOption) return searchErrorV2("N025", { userID });

    await interactEmailSettingSchema.findOneAndUpdate(
        { _id: userID },
        {
            notifications: validOptions.notifications != null ? foundOptions.notifications : foundSettings.notifications,
            emailSub: validOptions.emailSub !=null ? foundOptions.emailSub : foundSettings.emailSub,
            emailNewsLetter: validOptions.emailNewsLetter != null ? foundOptions.emailNewsLetter : foundSettings.emailNewsLetter,
            emailAlerts: validOptions.emailAlerts != null? foundOptions.emailAlerts : foundSettings.emailAlerts,
            emailReplies: validOptions.emailReplies != null? foundOptions.emailReplies : foundSettings.emailReplies,
            emailMentions: validOptions.emailMentions != null? foundOptions.emailMentions : foundSettings.emailMentions,
        },
        { upsert: true }
    );

    const updatedSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    return updatedSettings;
}

module.exports = { settings, possibleOptions };