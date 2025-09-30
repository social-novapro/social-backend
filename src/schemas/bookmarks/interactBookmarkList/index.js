const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString, reqBool } = require('../../types');

const interactBookmarkList = mongoose.Schema({
    _id: reqString, // listID
    version: reqNum, // version of schema
    listname: reqString, // name of list
    default: reqBool, // is default list
    description: nonreqString, // description of list
    privacy: reqNum, // privacy setting of list
    // currentIndexID: nonreqString, // could be empty
    // dont need this really
    userID: reqString, // who owns the list
    timestamp: reqNum, // time created list
    active: reqNum, // 0 = archived, 1 = active
});

module.exports = mongoose.model('interact-bookmark-list', interactBookmarkList);