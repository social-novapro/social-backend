const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { v4: uuidv4 } = require('uuid');
const { emailSender } = require('../../email/send');
const { checktime } = require('../../checktime');
const { checkPassword } = require('../../userAuth');

async function confirmRemove({ emailVerID }) {
    const removed = await removeEmail({ email, userID, password});
    if (!removed) return false;

}

async function removeEmail({ email, userID, password }) {
    // if user decides to remove the email
    // check if email is verified
//     await interactUserPrivSchema.findOneAndUpdate({
//         _id: userID,
//         password: password,
//         email: email
//     }, {

}
// delete interactEmailSettings


// remove email from interactUserPrivSchema
// remove current email from interactEmailVerificationSchema


// sends a request to remove email
async function requestRemove({ currentEmail, userID, password }) {
    // UNTESTED
    // checks password 
    const passwordCorrect = await checkPassword({ userID: userID, password: password });
    if (!passwordCorrect || passwordCorrect.error) return { error: 'Password incorrect' };
   
    const VerData = await interactEmailVerificationSchema.findOne({
        userID: userID
    });

    if (!VerData) return { error: 'Email not found' };
    if (VerData.verified !== true) return { error: 'Email not verified' };
    if (!VerData.email) return { error: 'Email not found' };
    if (VerData.email !== currentEmail) return { error: 'Provided email not equal' };
    if (VerData.shouldRemoveEmail === true && VerData.removeEmailVerID) return { error: 'Email already requested to be removed' };


    // send a request to remove email
    const removeEmailVerID = uuidv4();
    const timestampRemoveEmail = checktime();

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailVerID
    }, {
        removeEmailVerID: removeEmailVerID,
        shouldRemoveEmail: true,
        timestampRemoveEmail: timestampRemoveEmail
    });

    // send email to user

    await sendEmailRemoveVer({ email: currentEmail, userID, emailVerID: removeEmailVerID });

    return true;
}

// send email remove request
async function sendEmailRemoveVer({ email, userID, emailVerID }) {
    const verURL = `https://interact-api.novapro.net/v1/emails/requests/confirmRemove/${emailVerID}/`;
    
    const emailSent = await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Email Removal Interact",
        content: `Please verify your removal request. Open: ${verURL} to verify. Thank you.`,
        htmlElement: {
            h1: "Verify email removal at Interact",
            p: "Please confirm your removal request, open link to verify.",
            a: `${verURL}`,
        }
    });

    return { "status": "success", emailSent };
}

module.exports = { removeEmail, requestRemove };