const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { v4: uuidv4 } = require('uuid');
const { emailSender } = require('../../email/send');
const { checktime } = require('../../checktime');
const { checkPassword } = require('../../userAuth');
const { current } = require("../../../../config.json");
const { searchError } = require('../../searchError');

// need to test properly
async function confirmRemove({ removeEmailVerID }) {
    const foundRemove = await interactEmailVerificationSchema.findOne({ removeEmailVerID });
    console.log("foundRemove", foundRemove)
    if (!foundRemove) return searchError("N014");

    await removeRemoveEmailVerID({ removeEmailVerID });

    const { userID, email } = foundRemove;

    const removed = await removeEmail({ email, userID });
    if (!removed || removed.error) return removed;

    return true;
}

// remove removeEmailVerID from interactEmailVerificationSchema
// UNTESTED
async function removeRemoveEmailVerID({ removeEmailVerID }) {
    await interactEmailVerificationSchema.findOneAndUpdate({
        removeEmailVerID
    }, {
        removeEmailVerID: null
    });
    return true;
}

// if user decides to remove the email
async function removeEmail({ email, userID }) {
    // check if theres a replaceCurrent
    const foundEmailVer = await interactEmailVerificationSchema({ userID });
    if (!foundEmailVer) return searchError("N015");
    if (foundEmailVer.email !== email) return searchError("N016");

    if (foundEmailVer.replaceCurrent && foundEmailVer.replaceEmail) {
        // send email to replaceCurrent
        // TODO, use sendVerReplace() from ./setEmail
        return 
    }

    // working
    const del1 = await delEmailSettings({ email, userID });
    console.log("del1", del1)
    if (!del1 || del1.error) return del1;
    
    // seems to work
    const del2 = await removeEmailPriv({ email, userID });
    console.log("del2", del2)
    if (!del2 || del2.error) return del2;

    // now working
    const del3 = await removeCurrentEmail({ email, userID });
    console.log("del3", del3)
    if (!del3 || del3.error) return del3;

    return true;
}

// delete interactEmailSettings
async function delEmailSettings({ email, userID }) {
    const foundSettings = await interactEmailSettingSchema.findOne({ userID: userID });
    if (!foundSettings) return searchError("N010");
    if (foundSettings.email != email) return searchError("N011");

    await interactEmailSettingSchema.findOneAndDelete({
        _id: userID
    });

    return true;
}


// remove email from interactUserPrivSchema
async function removeEmailPriv({ email, userID }) {
    const foundPriv = await interactUserPrivSchema.findOne({ _id: userID });
    if (!foundPriv) return searchError("B013");
    if (foundPriv.email !== email) return searchError("N012");

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
    if (!foundVer) return searchError("N014");
    if (foundVer.email !== email) return searchError("N013");

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
    // checks password 
    const passwordCorrect = await checkPassword({ userID: userID, password: password });
    if (!passwordCorrect || passwordCorrect.error) return { error: searchError("G005") };
   
    const VerData = await interactEmailVerificationSchema.findOne({
        userID: userID
    });

    if (!VerData) return searchError("N014")
    // if email is not verified
    // maybe make it so that if email is not verified, it will still send a request to remove email anyways
    if (VerData.verified !== true) return searchError("N022");
    // theres no email set (for some reason?)
    if (!VerData.email) return searchError("N020");
    // if the email is not the same as the current email 
    if (VerData.email !== currentEmail) return searchError("N021");
    // in future send another request to remove email
    if (VerData.shouldRemoveEmail === true && VerData.removeEmailVerID) {
        // sends request to remove email again
        // same ID as previous
        // could replace with a new ID in future
        await sendEmailRemoveVer({ email: currentEmail, userID, emailVerID: VerData.removeEmailVerID });
        return true;
    };


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