const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString, reqBool } = require('../../types');

const interactBookmarkListIndex = mongoose.Schema({
    _id: reqString, // listIndexID (or UUID)
    version: reqNum, // version of schema
    listID: reqString, // listID
    timestamp: reqNum, // time created
    prevID: nonreqString,
    nextID: nonreqString,
    current: reqBool, 
    saves: [reqString] // saved bookmarkIDs
});


module.exports = mongoose.model('interact-bookmark-list-index', interactBookmarkListIndex);