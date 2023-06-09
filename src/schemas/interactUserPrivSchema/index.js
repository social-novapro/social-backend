const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
};
const reqBool = {
    type: Boolean,
    required: false
};

const interactUserPrivSchema = mongoose.Schema({
    _id: reqString,
    userToken: reqString,
    email: nonreqString,
    // accessTokens: [reqString],
    salted: reqBool,
    password: reqString,
    devToken: nonreqString
});

module.exports = mongoose.model('interact-user-priv', interactUserPrivSchema);