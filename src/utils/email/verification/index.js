const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');

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

    // send email to user that email has been verified
    // write code

    return { success: true, DB: accept };
}


module.exports = { verifyEmail }
