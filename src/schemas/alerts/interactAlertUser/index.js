const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonReqstring = {
    type: String,
    required: false
}
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};

const dismissedAlerts = mongoose.Schema({
    _id: reqString, // alertID
    dismissedAlerts: reqString, 
    timeDismissed: reqNum,
});

const interactAlertUser = mongoose.Schema({
    _id: reqString, // userID
    dismissedAlerts: [dismissedAlerts],
});

module.exports = mongoose.model('interact-alert-user', interactAlertUser);