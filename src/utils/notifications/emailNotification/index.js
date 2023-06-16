const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const { emailSender } = require('../../email/send/');

async function emailNotification({ userID, posterUserID, postID }) {
    if (!userID || !posterUserID || !postID) return;
    const foundEmailSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundEmailSettings) return;

    const { email, emailSub, notifications } = foundEmailSettings;
    if (!emailSub || !notifications) return;

    const userData = await interactUserSchema.findOne({ _id: posterUserID });
    const subURL = `https://interact.novapro.net/?postID=${postID}`;

    const emailSent = await emailSender({
        users: [
            {
                userID,
                email,
            }
        ],
        type: 40,
        subject: 'New Notification',
        content: `You have a new notification on Interact! @${userData.username} posted, click here to view! ${subURL}`,
        htmlElement: {
            h1: 'New Notification',
            p: `@${userData.username} posted! Check it out!`,
            a: `${subURL}`,
        }
    });

    return emailSent;
}

module.exports = { emailNotification };