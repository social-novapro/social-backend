const interactEmailVerificationSchema = require('../../../schemas/emails/interactEmailVerificationSchema');
const { searchError } = require('../../searchError');
const { v4: uuidv4 } = require('uuid');

async function verifyEmail({ emailVerID }) {
    const emailReqFound = await interactEmailVerificationSchema.findOne({ _id: emailVerID });
    if (!emailReqFound) return searchError("N001");
    
    const accept = await interactEmailVerificationSchema.findOneAndUpdate(
        { _id: emailVerID },
        { verified: true },
        { new: true }
    );
    
    return { success: true, DB: accept };
}


module.exports = { verifyEmail }