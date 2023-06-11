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
    timestamp: nonreqNum, // time sent
    verified: nonreqBool, // if email is verified
    email: nonreqString // email address
});

const interactEmailVerificationSchema = mongoose.Schema({
    _id: reqString, // emailVerID
    timestamp: reqNum, // time sent
    timestampVerfied: nonreqNum, // time verified
    verified: reqBool, // if email is verified
    email: reqString, // email address
    replaceCurrent: reqBool, // if email should replace current email
    userID: reqString, // userID
    emailHistory: [emailHistoryData], // email history
    verificationID: nonreqString, // verification ID sent to email
});


module.exports = mongoose.model('interact-email-verification', interactEmailVerificationSchema);