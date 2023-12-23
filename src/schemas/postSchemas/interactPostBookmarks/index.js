const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const bookmarkLists = {
    name: reqString, // namelist
    timestamp: reqNum // time created
};

const bookmarks = {
    _id: reqString, // postid
    bookmarkList: reqString, // list saved
    timestamp: reqNum // time svaed
};

const interactPostBookmarks = mongoose.Schema({
    _id: reqString, // userid
    saves: [bookmarks], // saved posts
    lists: [bookmarkLists] // lists
});

module.exports = mongoose.model('interact-post-bookmarks', interactPostBookmarks);