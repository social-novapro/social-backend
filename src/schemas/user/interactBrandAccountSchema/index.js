const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const userBrandSchema = mongoose.Schema({
    _id: reqString, // userID (of person who has access)
    timestamp: reqNum, // time added
    accessLevel: reqNum
    /*
        1: owner
            access to everything
        2: admin
            access to everything (minus deleting account)
        3: manager
            can delete other posts
        4: poster
            can post in place of brand account
    */
});

const interactBrandAccountSchema = mongoose.Schema({
    _id: reqString, // userID (of brand)
    users: [userBrandSchema]
    // follow: [userFollow] 
});

module.exports = mongoose.model('interact-brand-account-schema', interactBrandAccountSchema);