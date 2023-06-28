const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { v4: uuidv4 } = require('uuid');
const { emailSender } = require('../../email/send');
const { checktime } = require('../../checktime');
const { checkPassword } = require('../../userAuth');
const { current } = require("../../../../config.json")

// need to test properly
async function confirmRemove({ removeEmailVerID }) {
    const foundRemove = await interactEmailVerificationSchema.findOne({ removeEmailVerID });
    console.log("foundRemove", foundRemove)
    if (!foundRemove) return false;

    const { userID, email } = foundRemove;

    const removed = await removeEmail({ email, userID });
    if (!removed) return false;

    return true;
}

// if user decides to remove the email
async function removeEmail({ email, userID }) {
    // working
    const del1 = await delEmailSettings({ email, userID });
    console.log("del1", del1)
    if (!del1) return false;
    
    // seems to work
    const del2 = await removeEmailPriv({ email, userID });
    console.log("del2", del2)
    if (!del2) return false;

    // fails
    // now working
    const del3 = await removeCurrentEmail({ email, userID });
    console.log("del3", del3)
    if (!del3) return false;

    return true;
}

// delete interactEmailSettings
async function delEmailSettings({ email, userID }) {
    const foundSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    console.log("foundSettings", foundSettings)
    if (!foundSettings) return false;

    if (foundSettings.email != email) return false;

    await interactEmailSettingSchema.findOneAndDelete({
        _id: userID
    });

    return true;
}


// remove email from interactUserPrivSchema
async function removeEmailPriv({ email, userID }) {
    const foundPriv = await interactUserPrivSchema.findOne({ _id: userID });
    if (!foundPriv) return false;
    if (foundPriv.email !== email) return false;

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, {
        email: null
    });

    return true;
}

// remove current email from interactEmailVerificationSchema+add to history
async function removeCurrentEmail({ email, userID }) {
    const foundVer = await interactEmailVerificationSchema.findOne({ userID: userID });
    if (!foundVer) return false;
    if (foundVer.email !== email) return false;

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: foundVer._id
    }, {
        email: null,
        verified: false,
        timestampVerified: null,
        timestampEmail: null,
        verificationID: null,

        shouldRemoveEmail: false,
        removeEmailVerID: null,
        timestampRemoveEmail: null
    });

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: foundVer._id
    }, {
        $push: {
            emailHistory: {
                _id: foundVer.verificationID,
                timestamp: foundVer.timestampVerified,
                verified: foundVer.verified,
                email: foundVer.email
            }
        }
    });

    return true;
}

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
        _id: VerData._id
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
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?removeEmail=${emailVerID}/`;
    //const verURL = `https://interact-api.novapro.net/v1/emails/requests/confirmRemove/${emailVerID}/`;
    
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

module.exports = { confirmRemove, requestRemove };