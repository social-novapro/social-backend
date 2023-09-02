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

const interactAlertSystem = mongoose.Schema({
    _id: reqString, // "main"
    timestamp: reqNum, // time of last alert
    currentAlert: nonReqstring, // could have been removed
    currentIndex: reqString, // always will have index
    previousIndex: nonReqstring, // could be first index
});

module.exports = mongoose.model('interact-alert-system', interactAlertSystem);