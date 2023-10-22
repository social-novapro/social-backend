const mongoose = require('mongoose');
const { nonreqMixed, reqString } = require('../../types');

const interactDeletedUserSchema = new mongoose.Schema({
    _id: reqString, // unique ID
    allData: nonreqMixed
});

module.exports = mongoose.model('interact-deleted-user', interactDeletedUserSchema);
