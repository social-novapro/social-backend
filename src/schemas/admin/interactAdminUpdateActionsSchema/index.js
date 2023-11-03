const mongoose = require('mongoose');
const { reqString, reqNum, reqBool } = require('../../types');

const interactAdminUpdateActionsSchema = mongoose.Schema({
    _id: reqString, // action
    done: reqBool,
    timestamp: reqNum
});

module.exports = mongoose.model('interact-admin-update-actions', interactAdminUpdateActionsSchema);