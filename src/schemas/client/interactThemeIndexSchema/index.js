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

const themeIndexSchema = mongoose.Schema({
    _id: reqString, // themeID
});

const interactThemeSchema = mongoose.Schema({
    _id: reqString, // indexid
    timestamp: reqNum,
    nextID: nonreqString, // next id
    prevID: nonreqString, // prev id
    amount: reqNum, // amount of themes
    themeIDs: [themeIndexSchema]
});

module.exports = mongoose.model('interact-theme-index', interactThemeSchema);
