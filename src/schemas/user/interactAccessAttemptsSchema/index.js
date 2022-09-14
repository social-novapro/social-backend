const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const interactAccessAttemptsSchema = mongoose.Schema({
    _id: reqString, 
    currentAttempCount: reqNum,
    lastAttempt: reqNum,
    nextTimeout: reqString, // 30, 50, 70
});

module.exports = mongoose.model('interact-access-attempts', interactAccessAttemptsSchema);