const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const bookmarkLists = {
    name: reqString, // namelist
    timestamp: reqString // time created
};

const bookmarks = {
    _id: reqString, // postid
    bookmarkList: reqString, // list saved
    timestamp: reqString // time svaed
};

const interactPostBookmarks = mongoose.Schema({
    _id: reqString, // userid
    saves: [bookmarks], // saved posts
    lists: [bookmarkLists] // lists
});


module.exports = mongoose.model('interact-post-bookmarks', interactPostBookmarks);