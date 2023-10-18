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

/*
    this can be used for any indexes needed in the main system
*/
const interactIndexSchema = mongoose.Schema({
    _id: reqString, // "production"
    themeIndex: nonreqString,
});

module.exports = mongoose.model('interact-indexes', interactIndexSchema);
