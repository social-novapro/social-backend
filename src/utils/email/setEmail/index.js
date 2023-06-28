const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../../checktime');
const { emailSender } = require('../send');
const { checkPassword } = require('../../userAuth');
const { current } = require("../../../../config.json");
const { requestRemove } = require('../removeEmail');

// set email verification request
async function setEmail({email, userID, password }) {
    if (!email) return searchError("N004")
    if (!userID) return searchError("Z002", [{ name: "msg", data: "no userID provided"}] )
    if (!password) return searchError("Z002", [{ name: "msg", data: "no passsword provided"}] )

    // checks if password is correct
    const passwordCorrect = await checkPassword({ userID: userID, password: password });
    if (!passwordCorrect || passwordCorrect.error) return { error: 'Password incorrect' };

    // is email valid
    const isValid = await validEmail({email});
    if (!isValid.valid) return isValid.error;

    // does user exist
    const userPriv = await interactUserPrivSchema.findOne({_id: userID });
    if (!userPriv) return searchError("C009");
    if (userPriv.email === email) return searchError("N003");

    // CHECK if password is correct 
    // !! DO

    // is email already in use or in pending verification
    const emailInUse = await checkEmailInUse({ email });
    if (emailInUse.error) return emailInUse.error;

    // check if user has pending user verification request
    
    const foundEmailVer = await findCurUserVer({ userID });
    var emailID;
    if (foundEmailVer.found ) {
        if (!foundEmailVer.data.email) {
            const completedSet = await setCurrentEmailDB({ emailID: foundEmailVer.data._id, userID, newEmail: email });
            if (!completedSet) return false;

            emailID = foundEmailVer.data._id;
        } else {
            if (foundEmailVer.data.email === email) return false;
    
            // sends a request for deletion email
            const confirmRemove = await requestRemove({ email: foundEmailVer.data.email, userID, password });
            // you can then re-request a new email
    
            // can also add a "replaceCurrent", 
            // then send the confirmation email to the new email once you confirm remove
    
            return false;
        }
    } else {
        // save email verification request
        const emailIDSet = await setEmailDB({ email, userID });
        if (!emailIDSet) return false
        emailID = emailIDSet;
    }

    const verificationID = await createVerificationID({ emailID });
    if (!verificationID) return false;

    // send email verification request
    const emailSent = await sendEmailVer({ email, userID, emailVerID: verificationID });
    return { "status": "success", emailSent, verificationID };
}

// create verificationID
async function createVerificationID({ emailID }) {
    const verificationID = uuidv4();
    
    await interactEmailVerificationSchema.findOneAndUpdate({ 
        _id: emailID
    }, {
        verificationID: verificationID
    });

    return verificationID;
}

// send email verification
async function sendEmailVer({ email, userID, emailVerID }) {
    const mainURL = current == "prod" ? `https://interact.novapro.net` : "http://localhost:5500";
    const verURL = `${mainURL}/emails/?verification=${emailVerID}/`;
    //const verURL = `https://interact-api.novapro.net/v1/emails/requests/verification/${emailVerID}/`;
    
    const emailSent = await emailSender({
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

    return { "status": "success", emailSent };
}

// find user's emailVer schema
async function findCurUserVer({ userID }) {
    //const foundEmailData = await interactEmailVerificationSchema.findOne({ _id: userID });
    const foundEmailData = await interactEmailVerificationSchema.findOne({ userID: userID });

    if (!foundEmailData) return { found: false };
    else return { found: true, data: foundEmailData };
}

// setting email
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

// is email in use
async function checkEmailInUse({ email }) {
    // if being used
    const emailFound = await interactUserPrivSchema.findOne({ email });
    if (emailFound) return { error: searchError("N006") };

    // if pending verification
    const foundVerification = await interactEmailVerificationSchema.findOne({ email });
    if (foundVerification) return { error: searchError("N006") };

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

module.exports = { setEmail, validEmail }