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

const interactEmailSettingSchema = mongoose.Schema({
    _id: reqString, // userID
    emailID: reqString, // emailID
    email: reqString, // email address
    notifications: reqBool, // if email should receive ANY notifications
    emailSub: reqBool, // if email should receive sub notifications
    emailNewsLetter: reqBool, // if email should receive newsletter
    emailAlerts: reqBool, // if email should receive alerts
    emailReplies: reqBool, // if email should receive replies
});

module.exports = mongoose.model('interact-email-setting', interactEmailSettingSchema);
