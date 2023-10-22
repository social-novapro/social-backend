const mongoose = require('mongoose');
const { reqString, reqBool, nonreqBool } = require('../../types');

const interactEmailSettingSchema = mongoose.Schema({
    _id: reqString, // userID
    email: reqString, // email address
    notifications: reqBool, // if email should receive ANY notifications
    emailSub: reqBool, // if email should receive sub notifications
    emailNewsLetter: reqBool, // if email should receive newsletter
    emailAlerts: reqBool, // if email should receive alerts
    emailReplies: reqBool, // if email should receive replies
    emailMentions: nonreqBool, // if email should receive replies
});

module.exports = mongoose.model('interact-email-setting', interactEmailSettingSchema);
