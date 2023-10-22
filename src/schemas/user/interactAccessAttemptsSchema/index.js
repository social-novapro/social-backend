const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactAccessAttemptsSchema = mongoose.Schema({
    _id: reqString, 
    currentAttempCount: reqNum,
    lastAttempt: reqNum,
    nextTimeout: reqString, // 30, 50, 70
});

module.exports = mongoose.model('interact-access-attempts', interactAccessAttemptsSchema);