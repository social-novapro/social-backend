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

const colourThemeSchema = mongoose.Schema({
    _id: reqString, // id of theme ig
    posts: nonreqString,
    background: nonreqString,
    navigation: nonreqString,
    navSecondary: nonreqString,
    menu: nonreqString,
    menuButton: nonreqString,
    font_menuButton: nonreqString,
    font_h1: nonreqString,
    font_p: nonreqString,
    font_p_secondary_user: nonreqString,
    font_p_posts: nonreqString,
    font_p_user: nonreqString,
    font_p_user_own: nonreqString,
    // can add more later
});

const interactThemeSchema = mongoose.Schema({
    _id: reqString, // id of theme
    userID: reqString, // who created the theme
    indexID: reqString, // index id
    theme_name: reqString, // name for theme
    timestamp: reqNum,
    timestamp_edited: reqNum,
    locked: reqBool,
    theme_fork: nonreqString, // theme forked from
    privacy: reqNum, // 1: public, 2: friends of friends, 3: private
    colourTheme: colourThemeSchema, // colour theme
});

module.exports = mongoose.model('interact-theme', interactThemeSchema);
