const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const userBrandSchema = mongoose.Schema({
    _id: reqString, // userID (of person who has access)
    timestamp: reqNum, // time added
    accessLevel: reqNum
    /*
    TAG INDEX SCHEMA
        _id: indexID
        tagType : 1-hastag, 2-usertag
        tagTerm : which search result
        current : is it current 
        nextID
        prevID

    TAG DATA SCHEMA
        tagID
        type : 1-hastag, 2-usertag
        postID : from which post
        index : index of post text
        tagTerm : term to replace
        userID
    */
});

const interactBrandAccountSchema = mongoose.Schema({
    _id: reqString, // userID (of brand)
    users: [userBrandSchema]
});

module.exports = mongoose.model('interact-mention-schema', interactBrandAccountSchema);