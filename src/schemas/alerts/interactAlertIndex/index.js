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

const interactAlertIndex = mongoose.Schema({
    _id: reqString,
    previousIndex: reqString,
    nextIndex: reqString,
    alerts: [reqString]
});

module.exports = mongoose.model('interact-alert-index', interactAlertIndex);