const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactEmailSettingSchema = require('../../../schemas/emails/interactEmailSettingSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { searchError, searchErrorV2 } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');
const { emailSender } = require('../send');
const { checktime } = require('../../checktime');
const { checkPassword } = require('../../userAuth');
const { awardUserBadge } = require('../../user/badges');
const { logData } = require('../../logging');

async function verifyEmail({ emailVerID, password }) {
    const emailReqFound = await interactEmailVerificationSchema.findOne({ verificationID: emailVerID });
    if (!emailReqFound) return searchError("N001");

    const { userID } = emailReqFound;

    if (emailReqFound.verified) return searchErrorV2("N009", { userID });


    // check password
    const passwordCorrect = await checkPassword({ userID, password });
    if (!passwordCorrect || passwordCorrect.error) return searchErrorV2("G005", { userID });
    
    // verified = true for verificatino Schema
    const accept = await interactEmailVerificationSchema.findOneAndUpdate(
        { _id: emailReqFound._id },
        { 
            verified: true,
            timestampVerified: checktime(),
            verificationID: null,
            timestampVerSent: null
        },
        { new: true }
    );

    // update user email in user priv
    await interactUserPrivSchema.findOneAndUpdate({ 
        _id: emailReqFound.userID 
    }, { 
        email: emailReqFound.email 
    });

    // removes others
    await removeOthers({ userID: emailReqFound.userID, email: emailReqFound.email });
    
    // set email setting
    await setEmailSetting({ userID: emailReqFound.userID, email: emailReqFound.email });

    const interactURL = "https://interact.novapro.net/"

    // !! email doesnt seem to get recieved?? - on outlook school email
    // send email to user that email has been verified
    const email = await emailSender({
        users: [{
            email: emailReqFound.email,
            userID: emailReqFound.userID,
            bbc: false
        }],
        type: 2,
        subject: "Email Verified!",
        content: `Thank you for verifying your email! Open: ${interactURL} to explore the rest of interact!`,
        htmlElement: {
            h1: "Email Verified!",
            p: "Thank you for verifying your email! Check out the rest of Interact!",
            a: `${interactURL}`,
        }
    });

    await awardUserBadge({ userID, badgeID: "email_verified" });

    return { success: true, DB: accept };
}

// removes any other person that may have attempted to asign email to account
async function removeOthers({ userID, email }) {
    const foundEmailAssignments = await interactEmailVerificationSchema.find({ email });

    for (const emailFound of foundEmailAssignments) {
        if (emailFound.userID != userID ) {
            await interactEmailVerificationSchema.findOneAndUpdate({ _id: emailFound._id}, { email: null });
        }
    }
}

// set up Email Setting Schema
async function setEmailSetting({ userID, email }) {
    if (!email) return logData("no email? " + email)
    const foundEmailSettings = await interactEmailSettingSchema.findOne({ _id: userID });
    if (foundEmailSettings) {
        await interactEmailSettingSchema.findOneAndUpdate({
            _id: userID
        }, {
            email: email,
        });

        return true;
    }
    
    await interactEmailSettingSchema.create({
        _id: userID,
        email: email,
        notifications: true,
        emailSub: true,
        emailNewsLetter: false,
        emailAlerts: true,
        emailReplies: true,
    });
    
    return true;
}

module.exports = { verifyEmail }
