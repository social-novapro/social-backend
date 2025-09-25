const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString } = require('../../types');

const interactBookmark = mongoose.Schema({
    _id: reqString, // bookmarkID
    version: reqNum, // version of schema
    contentUUID: reqString, // content UUID
    contentType: reqNum,
    /*
    0 = post - postID
    1 = user - userID
    2 = notification - notificationID
    3 = ai response - responseID
    4 = image or media - mediaID
    5 = chat message - messageID
    */
    userID: reqString, // userID, 
    timestamp: reqNum, // time bookmarked
    listID: reqString, // which list is this bookmark
    indexID: reqString, // which list index this bookmark placed in
    active: reqNum, // 0 = archived, 1 = active
});

module.exports = mongoose.model('interact-bookmark', interactBookmark);