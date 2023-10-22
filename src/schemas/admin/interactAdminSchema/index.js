const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const interactAdminSchema = mongoose.Schema({
    _id: reqString, // userid
    adminType: reqNum, // rank of admin
    /*
        3 | owner
        2 | Super Admin | Can do anything
            can put admin under review
        2 | Admin | Can do anything except delete other admins
            can delete users 
        1 | Moderator 
            can delete posts, comments, and can put users on probation for admin review
        0 | nothing (shouldnt be saved) 
        Can do anything except delete other admins and moderators
    */
    timestamp: reqString, // time of acceptance into admin
    lastReviewID: reqString, // link to review schema
    /*
        _id: id of review
        timestamp: time of review
        userID: id of user in review
        userReviewID: id of review
    */
});

module.exports = mongoose.model('interact-admin-schema', interactAdminSchema);