const mongoose = require('mongoose');
const { nonreqString, reqNum, reqString } = require('../../types');

const themeIndexSchema = mongoose.Schema({
    _id: reqString, // themeID
});

const interactThemeIndexSchema = mongoose.Schema({
    _id: reqString, // indexid
    timestamp: reqNum,
    nextID: nonreqString, // next id
    prevID: nonreqString, // prev id
    amount: reqNum, // amount of themes
    themeIDs: [themeIndexSchema]
});

module.exports = mongoose.model('interact-theme-index', interactThemeIndexSchema);
