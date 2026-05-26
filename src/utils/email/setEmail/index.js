const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');

const { searchError, searchErrorV2 } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../../checktime');
const { emailSender } = require('../send');
const { checkPassword } = require('../../userAuth');
const { current } = require("../../../../config.json");
const { revokeUserBadge } = require('../../user/badges');
const { checkBlockedEmailDomain } = require('../domainBlocklist');

// set email verification request
async function setEmail({ email, userID, password }) {
    if (!email) return searchErrorV2("N004", { userID });
    if (!userID) return searchErrorV2("Z002", { userID, options: [{ name: "msg", data: "no userID provided"}]} );
    if (!password) return searchErrorV2("Z002", { userID, options: [{ name: "msg", data: "no passsword provided"}]} );

    const blockedEmail = checkBlockedEmailDomain({ email, userID });
    if (blockedEmail.blocked) return blockedEmail.error;

    // checks if password is correct
    const passwordCorrect = await checkPassword({ userID: userID, password: password });
    if (!passwordCorrect || passwordCorrect.error) return searchErrorV2("G005", { userID });


    const foundEmailVer = await findCurUserVer({ userID });

    // check if its the same and unverified, and doesnt have a remove request
    if (foundEmailVer.found) {
        if (
            foundEmailVer.data.email === email && 
            !foundEmailVer.data.verified && 
            foundEmailVer.data._id && 
            !foundEmailVer.data.removeEmailVerID
        ) {
            
            const resent = await resendSetEmail({ email, userID, emailID: foundEmailVer.data._id });
            return resent;
        }
    }

    // is email valid
    const isValid = await validEmail({email});
    if (!isValid.valid) return isValid.error;

    // does user exist
    const userPriv = await interactUserPrivSchema.findOne({_id: userID });
    if (!userPriv) return searchErrorV2("C009", { userID });
    if (userPriv.email === email) return searchErrorV2("N003", { userID });

    // is email already in use or in pending verification
    const emailInUse = await checkEmailInUse({ email });
    if (emailInUse.error) return emailInUse;

    // check if user has pending user verification request
    
    //const foundEmailVer = await findCurUserVer({ userID });
    var emailID;
    if (foundEmailVer.found) {
        // also check if verified or not

        // if theres no email set
        if (!foundEmailVer.data.email || !foundEmailVer.data.verified) {
            const completedSet = await setCurrentEmailDB({ emailID: foundEmailVer.data._id, userID, newEmail: email });
            if (!completedSet || completedSet.error) return searchErrorV2("N018", { userID });

            emailID = foundEmailVer.data._id;
        } else {
            // in future resend email verification
            if (foundEmailVer.data.email === email) {
                // sends request to ver again
                // same ID as pervious
                await resendSetEmail({ email, userID, emailID: foundEmailVer.data._id });
                return { "status": "success", "msg" : "check your email for verification code!"}
            };

            // there is already an email that was verified, must send a request to remove it first

            // sends a request for deletion email
            await requestRemove({ currentEmail: foundEmailVer.data.email, userID, password });

            // you can then re-request a new email
            await addReplaceCurrent({ emailID: foundEmailVer.data._id, newEmail: email });

            return { "status": "success", "msg" : "check your previous email for removal verification code! Then your new email!" };
        }
    } else {
        // save email verification request
        const emailIDSet = await setEmailDB({ email, userID });
        if (!emailIDSet) return searchErrorV2("N016", { userID });
        emailID = emailIDSet;
    }

    const verificationID = await createVerificationID({ emailID });
    if (!verificationID) return searchErrorV2("N015", { userID });

    // send email verification request
    await sendEmailVer({ email, userID, emailVerID: verificationID });
    //return { "status": "success", emailSent, verificationID };
    return { "status": "success", "msg" : "check your email for verification code!" };
}


// replcaes .replaceEmail to .email
async function replaceCurrentToEmail({ emailVerData, userID }) {
    if (!emailVerData.replaceCurrent || !emailVerData.replaceEmail) return searchErrorV2("N026", { userID });

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailVerData._id
    }, {
        email: emailVerData.replaceEmail,
        replaceCurrent: false,
        replaceEmail: null
    });


    const newEmailVerData = await interactEmailVerificationSchema.findOne({ _id: emailVerData._id });

    return newEmailVerData;
}

// get current email verification
async function getVerID({ userID }) {
    const foundEmailVer = await findCurUserVer({ userID });
    if (!foundEmailVer.found || !foundEmailVer.data || !foundEmailVer.data.verificationID) return searchErrorV2("N020", { userID });

    return foundEmailVer.data.verificationID;
}

// resends email verification with same verificationID
async function resendSetEmail({ email, userID, emailID }) {
    const verificationID = await getVerID({ emailID });
    if (verificationID.error) return verificationID;

    // send email verification request
    await sendEmailVer({ email, userID, emailVerID: verificationID });
    return { "status": "success" };
}

// create verificationID
async function createVerificationID({ emailID }) {
    const verificationID = uuidv4();
    
    await interactEmailVerificationSchema.findOneAndUpdate({ 
        _id: emailID
    }, {
        verificationID: verificationID,
        timestampVerSent: checktime()
    });

    return verificationID;
}

// send email verification
async function sendEmailVer({ email, userID, emailVerID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?verification=${emailVerID}/`;
    //const verURL = `https://interact-api.novapro.net/v1/emails/requests/verification/${emailVerID}/`;
    
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 0,
        subject: "Email Verification Interact",
        content: `Please verify your email. Open: ${verURL} to verify. Thank you.`,
        htmlElement: {
            h1: "Verify your email at Interact",
            p: "Please verify your email",
            a: `${verURL}`,
        }
    });

    return { "status": "success"  };
}

// find user's emailVer schema
async function findCurUserVer({ userID }) {
    //const foundEmailData = await interactEmailVerificationSchema.findOne({ _id: userID });
    const foundEmailData = await interactEmailVerificationSchema.findOne({ userID: userID });

    if (!foundEmailData) return { found: false, error: searchErrorV2("N014", { userID }) };
    else return { found: true, data: foundEmailData };
}

// add replaceCurrent to emailVer schema
async function addReplaceCurrent({ emailID, newEmail }) {
    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailID
    }, {
        replaceCurrent: true,
        replaceEmail: newEmail
    });

    return true;
};

// setting email
// creating email DB
async function setEmailDB({ email, userID, replace }) {
    const emailID = uuidv4();
    await interactEmailVerificationSchema.create({
        _id: emailID,
        timestamp: checktime(),
        verified: false,
        email: email,
        userID: userID,
        replaceCurrent: false,
    });

    return emailID;
}

// updating email DB
async function setCurrentEmailDB({ emailID, userID, newEmail }) {
    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailID
    }, {
        timestamp: checktime(),
        verified: false,
        email: newEmail,
        userID: userID,
        replaceCurrent: true,
    })

    return true;
}

// replace old email
// dont use this function - lets user remove old email without verification
async function replaceEmail({ emailID, newEmail, oldEmailData, userID }) {
    // set new email
    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailID
    }, {
        timestamp: checktime(),
        verified: false,
        email: newEmail,
        userID: userID,
        replaceCurrent: true,
    })

    // add to history
    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: emailID
    }, {
        $push : { "replaceEmails" : { 
            oldEmail: oldEmailData.email,
            timestampSet: oldEmailData.timestamp,
            wasVerified: oldEmailData.verified,
            timestampRemoved: checktime()
        }}
    });
}

// ran after last email is removed, and has a replaceCurrent
async function sendVerReplaceEmail({ userID }) {
    // password is already checked earlier
    // last email was already removed 

    const foundEmailVer = await findCurUserVer({ userID });
    if (foundEmailVer.found != true) return searchErrorV2("N014", { userID }); 

    if (!foundEmailVer.data.replaceCurrent) return searchErrorV2("N021", { userID });

    // replaceEmail
    const replacedEmail = await replaceCurrentToEmail({ emailVerData: foundEmailVer.data, userID });
    if (replacedEmail.error) return replacedEmail;

    // send email verification request
    const verificationID = await createVerificationID({ emailID: foundEmailVer.data._id });
    if (!verificationID) return searchErrorV2("N015", { userID });

    // send email verification request
    await sendEmailVer({ email: replacedEmail.email, userID, emailVerID: verificationID });
    //return { "status": "success", emailSent, verificationID };
    return { "status": "success", "msg" : "check your email for verification code!" };
}

// is email in use
async function checkEmailInUse({ email }) {
    // if being used
    const emailFound = await interactUserPrivSchema.findOne({ email });
    if (emailFound) return searchError("N006");

    // if pending verification
    const foundVerification = await interactEmailVerificationSchema.findOne({ email });
    if (foundVerification?.verified) return searchError("N006");

    return { success: true };
}

// is email valid
async function validEmail({ email }) {
    if (!email) return {
        "valid" : false,
        "error" : searchError("N004")
    };

    // is email valid
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return {
        "valid" : false,
        "email" : email,
        "error" : searchError("N005")
    }

    // check if in use
    const emailInUse = await checkEmailInUse({ email });
    if (emailInUse.error) return emailInUse.error;
    
    return { 
        "valid" : true,
        "email" : email
    };
}

// REMOVE EMAIL

// need to test properly
async function confirmRemove({ removeEmailVerID, password }) {
    const foundRemove = await interactEmailVerificationSchema.findOne({ removeEmailVerID });
    //console.log("foundRemove", foundRemove)
    if (!foundRemove) return searchError("N014");

    //await removeRemoveEmailVerID({ removeEmailVerID });

    const { userID, email } = foundRemove;

    // check password
    const passwordCorrect = await checkPassword({ userID, password });
    if (!passwordCorrect || passwordCorrect.error) return searchErrorV2("G005", { userID });

    const removed = await removeEmail({ email, userID });
    if (!removed || removed.error) return removed;

    await revokeUserBadge({ userID, badgeID: "email_verified" });

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
    const foundEmailVer = await interactEmailVerificationSchema.findOne({ userID });
    //console.log("foundEmailVer2", foundEmailVer)
    if (!foundEmailVer) return searchErrorV2("N015", { userID });
    if (foundEmailVer.email !== email) return searchErrorV2("N016", { userID });

    if (foundEmailVer.replaceCurrent && foundEmailVer.replaceEmail) {
        // send email to replaceCurrent

        // resets email verification schema
        const removeCurrent = await removeCurrentEmail({ email, userID });
        if (!removeCurrent || removeCurrent.error) return removeCurrent;

        // sends email to replaceCurrent, and sends ver code email 
        const replaceResult = await sendVerReplaceEmail({ userID });

        // remove email from interactUserPrivSchema
        const removeFromPriv = await removeEmailPriv({ email, userID });
        if (!removeFromPriv || removeFromPriv.error) return removeFromPriv;

        // remove email from settings
        const removeEmailSettings = await removeEmailFromSettings({ email, userID });
        if (!removeEmailSettings || removeEmailSettings.error) return removeEmailSettings;
 
        if (replaceResult.error) return replaceResult;
        return true;
    }

    // working
    const del1 = await delEmailSettings({ email, userID });
    if (!del1 || del1.error) return del1;
    
    // seems to work
    const del2 = await removeEmailPriv({ email, userID });
    if (!del2 || del2.error) return del2;

    // now working
    const del3 = await removeCurrentEmail({ email, userID });
    if (!del3 || del3.error) return del3;

    return true;
}

// remove email from interactEmailSettingSchema
async function removeEmailFromSettings({ email, userID }) {
    const foundSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundSettings) return searchErrorV2("N010", { userID });
    if (foundSettings.email != email) return searchErrorV2("N011", { userID });

    await interactEmailSettingSchema.findOneAndUpdate({
        _id: userID
    }, {
        email: null
    });

    return true;
}


// delete interactEmailSettings
async function delEmailSettings({ email, userID }) {
    const foundSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (!foundSettings) return searchErrorV2("N010", { userID });
    if (foundSettings.email != email) return searchErrorV2("N011", { userID });

    await interactEmailSettingSchema.findOneAndDelete({
        _id: userID
    });

    return true;
}

// remove email from interactUserPrivSchema
async function removeEmailPriv({ email, userID }) {
    const foundPriv = await interactUserPrivSchema.findOne({ _id: userID });
    if (!foundPriv) return searchErrorV2("B013", { userID });
    if (foundPriv.email !== email) return searchErrorV2("N012", { userID });

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
    if (!foundVer) return searchErrorV2("N014", { userID });
    if (foundVer.email !== email) return searchErrorV2("N013", { userID });

    await interactEmailVerificationSchema.findOneAndUpdate({
        _id: foundVer._id
    }, {
        timestampVerified: null,
        verified: false,
        email: null,

        //replaceCurrent
        //replaceEmail

        verificationID: null,
        timestampEmail: null,
        timestampVerSent: null,

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
                removedTimestamp: checktime(),
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
    if (!passwordCorrect || passwordCorrect.error) return searchErrorV2("G005");
   
    const VerData = await interactEmailVerificationSchema.findOne({
        userID: userID
    });

    if (!VerData) return searchErrorV2("N014", { userID })
    // if email is not verified
    // maybe make it so that if email is not verified, it will still send a request to remove email anyways
    if (VerData.verified !== true) return searchErrorV2("N022", { userID });
    // theres no email set (for some reason?)
    if (!VerData.email) return searchErrorV2("N020", { userID });
    // if the email is not the same as the current email 
    if (VerData.email !== currentEmail) return searchErrorV2("N021", { userID });
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
    
    await emailSender({
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
            p: "Please confirm your removal request, open the link to verify.",
            a: `${verURL}`,
        }
    });

    return { "status": "success" };
}

/**
 * wipe email DBs
 */
async function deleteEmailDBs({ userID }) {
    // remove veriifcation
    const foundVer = await interactEmailVerificationSchema.findOne({ userID });
    if (!foundVer) return searchErrorV2("N020", { userID })
    const deletedVer = await interactEmailVerificationSchema.findOneAndDelete({ userID });
    
    // wipe from priv
    if (foundVer.email) await removeEmailPriv({ email: foundVer.email, userID });
    
    // remove settings
    const foundSettings = await interactEmailSettingSchema.findOneAndDelete({ _id: userID });
    if (!foundSettings) return {
        deletedVer,
        error: searchErrorV2("N010", { userID })
    };

    return {
        foundVer,
        foundSettings
    }
}

module.exports = { 
    setEmail, validEmail, sendVerReplaceEmail,
    confirmRemove, requestRemove,
    deleteEmailDBs
}
