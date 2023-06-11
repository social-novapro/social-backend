const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../../checktime');
const { emailSender } = require('../send');

async function setEmail({email, userID }) {
    if (!email) return searchError("N004")
    if (!userID) return searchError("B009");

    // is email valid
    const isValid = validEmail({email});
    if (!isValid.valid) return isValid.error;

    // does user exist
    const userPriv = await interactUserPrivSchema.findOne({_id: userID});
    if (!userPriv) return searchError("C009");

    if (userPriv.email === email) return searchError("N003");

    // is email already in use
    const emailFound = await interactUserPrivSchema.findOne({email});
    if (emailFound) return searchError("N006");

    // check if user has a pending email verification request + not the same email
    const userEmailReqFound = await interactEmailVerificationSchema.findOne({ userID });
    if (userEmailReqFound && userEmailReqFound.email != email) return searchError("N007");
    
    // check if user has a pending email verification request + not the same email
    const emailReqFound = await interactEmailVerificationSchema.findOne({ email });
    if (emailReqFound && emailReqFound.userID != userID) return searchError("N008");

    // save email verification request


    // send email verification request
}

// setting email
async function setEmail({ email, userID, replace }) {
    const emailID = uuidv4();
    await interactEmailVerificationSchema.create({
        _id: emailID,
        timestamp: checktime(),
        verified: false,
        email: email,
        userID: userID,
        replaceCurrent: false,
    })
}

// replace old email
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

// only accessed within this file
async function requestVerifyEmail({ userID, email, userPriv }) {
    // creates ID and url
    const emailVerID = uuidv4();
    const verificationReq = await saveVerificationReq({
        userID,
        email,
        emailVerID,
        replaceCurrent: !userPriv.email ? true : false
    });

    const emailVerURL = `https://interact-api.novapro.net/v1/emails/requests/verification/${emailVerID}`;

    // sends email
    const emailSend = await emailSender({
        users: [{ userID, email }],
        type: 2,
        subject: "Verify your email at Interact",
        content: `Verify your email, click the link below: ${emailVerURL}`,
        htmlElement: {
            h1: "Verify your email at Interact",
            p: `Verify your email, click the link below:`,
            a: emailVerURL,
        }
    });
    // returns data
    return {
        success: true,
        verifyRequestDB: verificationReq,
        emailDB: emailSend
    };
}


// save verification request to DB
async function saveVerificationReq({ 
    userID, 
    email,
    emailVerID, 
    replaceCurrent
}) {

    const emailVerification = await interactEmailVerificationSchema.create({
        _id: emailVerID,
        timestamp: checktime(),
        verified: false,
        email: email,
        replaceCurrent: replaceCurrent,
        userID: userID
    });

    return {
        success: true,
        DB: emailVerification
    };
}

// is email valid
function validEmail({email}) {
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
    else return { 
        "valid" : true,
        "email" : email
    };
}

module.exports = { setEmail, validEmail }