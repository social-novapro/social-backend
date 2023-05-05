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
    _id: reqString,
    currentAlert: reqString, // check if it should be removed
    currentIndex: reqString,
    previousIndex: reqString,
});

module.exports = mongoose.model('interact-alert-system', interactAlertSystem);