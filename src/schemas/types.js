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

const nonreqNum = {
    type: Number,
    required: false
};

const reqBool = {
    type: Boolean,
    required: true
};

const nonreqBool = {
    type: Boolean,
    required: false
};

const reqMixed = {
    type: mongoose.Schema.Types.Mixed,
    required: true,
}

const nonreqMixed = {
    type: mongoose.Schema.Types.Mixed,
    required: false,
}

module.exports = {
    reqString,
    nonreqString,
    reqNum,
    nonreqNum,
    reqBool,
    nonreqBool,
    reqMixed,
    nonreqMixed,
}