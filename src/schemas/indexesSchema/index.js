const mongoose = require('mongoose');
const { reqString, nonreqString } = require('../types');

/*
    this can be used for any indexes needed in the main system
*/
const interactIndexSchema = mongoose.Schema({
    _id: reqString, // "production"
    themeIndex: nonreqString,
});

module.exports = mongoose.model('interact-indexes', interactIndexSchema);
