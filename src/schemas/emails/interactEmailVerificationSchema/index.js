const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
};
const reqNum = {
    type: Number,
    required: true
};
const nonreqNum = {
    type: Number,
    required: false
};

const reqBool = {
    type: Boolean,
    required: true
};
const nonreqBool = {
    type: Boolean,
    required: false
};

const emailHistoryData = mongoose.Schema({
    _id: nonreqString, // emailVerID
    timestamp: nonreqNum, // time verfied
    verified: nonreqBool, // if email is verified
    email: nonreqString // email address
});

const interactEmailVerificationSchema = mongoose.Schema({
    _id: reqString, // emailVerID
    userID: reqString, // userID
    timestamp: reqNum, // time created email settings
    timestampVerified: nonreqNum, // time verified
    verified: reqBool, // if email is verified
    email: reqString, // email address
    replaceCurrent: reqBool, // if email should replace current email
    emailHistory: [emailHistoryData], // email history

    verificationID: nonreqString, // verification ID sent to email
    timestampVerSent: nonreqNum, // time verification sent

    shouldRemoveEmail: nonreqBool, // email should be removed
    removeEmailVerID: nonreqString, // emailVerID to remove
    timestampRemoveEmail: nonreqNum, // time remove email requested
});


module.exports = mongoose.model('interact-email-verification', interactEmailVerificationSchema);