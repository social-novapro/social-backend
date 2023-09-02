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

const indexAdd = mongoose.Schema({
    _id: reqString
})

const interactAlertIndex = mongoose.Schema({
    _id: reqString,
    previousIndex: nonReqstring,
    nextIndex: nonReqstring,
    alerts: [indexAdd]
});

module.exports = mongoose.model('interact-alert-index', interactAlertIndex);