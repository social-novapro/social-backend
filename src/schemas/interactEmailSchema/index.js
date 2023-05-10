const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
};
const reqNum = {
    type: Number,
    required: true
};
const reqBool = {
    type: Boolean,
    required: true
};

const htmlElement = mongoose.Schema({
    h1: nonreqString,
    p: nonreqString,
    a: nonreqString,
    ahref: nonreqString
})

const userSend = mongoose.Schema({
    _id: nonreqString,
    email: nonreqString,
    failed: reqBool,
    isBCC: reqBool,
});

const interactEmailSchema = mongoose.Schema({
    _id: reqString,
    timestamp: reqNum,
    failed: reqBool,
    users: [userSend],
    subject: reqString,
    content: reqString,
    html: htmlElement,
});


module.exports = mongoose.model('interact-email', interactEmailSchema);