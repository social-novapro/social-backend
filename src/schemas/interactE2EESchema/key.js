const mongoose = require('mongoose');
const {keyObject} = require('crypto');
const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};
const reqKey = {
    type: Object,
    required: true
}
const interactE2EEKey = mongoose.Schema({
    _id: reqString,
    userID: reqString,
    targetuserID: reqString,
    key: reqKey,
    keyType: reqString,

});


module.exports = mongoose.model('interact-e2ee', interactE2EEKey);