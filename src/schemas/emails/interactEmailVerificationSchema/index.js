const mongoose = require('mongoose');
const { nonreqString, nonreqNum, nonreqBool, reqString, reqNum, reqBool } = require('../../types');

const emailHistoryData = mongoose.Schema({
    _id: nonreqString, // emailVerID
    timestamp: nonreqNum, // time verfied
    removedTimestamp: nonreqNum, // time removed
    verified: nonreqBool, // if email is verified
    email: nonreqString // email address
});

const interactEmailVerificationSchema = mongoose.Schema({
    _id: reqString, // emailVerID
    userID: reqString, // userID
    timestamp: reqNum, // time created email settings

    // current email settings
    timestampVerified: nonreqNum, // time verified
    verified: reqBool, // if email is verified
    email: reqString, // email address

    // replace email
    replaceCurrent: reqBool, // if email should replace current email
    replaceEmail: nonreqString, // email to email field with

    emailHistory: [emailHistoryData], // email history

    // add verification
    verificationID: nonreqString, // verification ID sent to email
    timestampVerSent: nonreqNum, // time verification sent

    // remove email
    shouldRemoveEmail: nonreqBool, // email should be removed
    removeEmailVerID: nonreqString, // emailVerID to remove
    timestampRemoveEmail: nonreqNum, // time remove email requested

    // delete account
    shouldDelAcc: nonreqBool,
    deleteAccountVerID: nonreqString, // delAccVerID
    timestampDeleteAccount: nonreqNum,

    // change password - do in future pr
    // forgot password 
    shouldForgotPass: nonreqBool, // if user knows password
    shouldChangePass: nonreqBool, // if user does not know the password
    replacePassVerID: nonreqString, // passVerID
    timestampReplacePass: nonreqNum
});


module.exports = mongoose.model('interact-email-verification', interactEmailVerificationSchema);