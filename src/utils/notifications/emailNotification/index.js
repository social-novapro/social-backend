const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const { emailSender } = require('../../email/send/');

async function emailNotification({ userID, posterUserID, postID }) {
    const foundEmailSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundEmailSettings) return console.log('none found');

    const { email, emailSub, notifcations } = foundEmailSettings;
    if (!emailSub || !notifcations) return console.log('none found');

    const userData = interactUserSchema.findOne({ _id: posterUserID });

    const subURL = `http://interact.novapro.net/?postID=${postID}`
    const emailSent = await emailSender({
        to: email,
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