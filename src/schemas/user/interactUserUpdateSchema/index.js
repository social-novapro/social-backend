const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqString } = require('../../types');

const interactUserUpdateSchema = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString, // user id
    timestamp: reqNum, // time created updated
    current: reqBool,
    field: reqString,
    fromValue: nonreqString,
    toValue: reqString,
});

module.exports = mongoose.model('interact-user-update-schema', interactUserUpdateSchema);