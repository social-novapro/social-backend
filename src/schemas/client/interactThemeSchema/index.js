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

const colourThemeSchema = mongoose.Schema({
    _id: reqString, // id of theme ig
    posts: nonreqString,
    background: nonreqString
    // can add more later
});

const interactThemeSchema = mongoose.Schema({
    _id: reqString, // id of theme
    userID: reqString, // who created the theme
    theme_name: reqString, // name for theme
    timestamp: reqNum,
    theme_fork: nonreqString, // theme forked from
    privacy: reqNum, // 1: public, 2: friends of friends, 3: private
    colourTheme: colourThemeSchema, // colour theme
});

module.exports = mongoose.model('interact-theme', interactThemeSchema);
