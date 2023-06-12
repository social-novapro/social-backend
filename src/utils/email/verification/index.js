const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');
const { emailSender } = require('../send');

async function verifyEmail({ emailVerID }) {
    const emailReqFound = await interactEmailVerificationSchema.findOne({ verificationID: emailVerID });
    if (!emailReqFound) return searchError("N001");
    if (emailReqFound.verified) return searchError("N009");
    
    // verified = true for verificatino Schema
    const accept = await interactEmailVerificationSchema.findOneAndUpdate(
        { _id: emailReqFound._id },
        { verified: true },
        { new: true }
    );

    // update user email in user priv
    await interactUserPrivSchema.findOneAndUpdate({ 
        _id: accept.userID 
    }, { 
        email: emailReqFound.email 
    });

    // set email setting
    await setEmailSetting({ userID: accept.userID });

    const interactURL = "https://interact.novapro.net/"

    // send email to user that email has been verified
    await emailSender({
        users: [{
            email: email,
            userID: userID,
            bbc: false
        }],
        type: 2,
        subject: "Email Verified!",
        content: `Thank you for verifying your email! Open: ${interactURL} to explore the rest of interact!.`,
        htmlElement: {
            h1: "Email Verified!",
            p: "Thank you for verifying your email! Check out the rest of Interact!",
            a: `${interactURL}`,
        }
    });


    return { success: true, DB: accept };
}

// set up Email Setting Schema
async function setEmailSetting({ userID }) {
    await interactEmailSettingSchema.create({
        _id: userID,
        emailID: emailID,
        email: email,
        notifications: true,
        emailSub: true,
        emailNewsLetter: false,
        emailAlerts: true,
        emailReplies: true,
    });
}

module.exports = { verifyEmail }
