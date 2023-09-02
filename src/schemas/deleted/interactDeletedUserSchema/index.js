const mongoose = require('mongoose');
const interactDeletedSchema = require('../interactDeletedSchema');
const interactUserSchema = require('../../interactUserSchema');
const interactUserAccessSchema = require('../../interactUserAccessSchema');
const developerToken = require('../../developer/developerToken');
const interactUserPrivSchema = require('../../interactUserPrivSchema');
const interactPostSchema = require('../../interactPostSchema');
const interactPostLikeSchema = require('../../postSchemas/interactPostLikeSchema');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
}
const reqNum = {
    type: Number,
    required: true
};

const interactDeletedUserSchema = new mongoose.Schema({
    _id: reqString, // unique ID
    allData: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
    },
        //type: mongoose.Schema.Types.ObjectId,
        //ref: 'interact-deletes', // Reference the 'interactDeletedSchema' model (adjust the model name as needed)
        //required: false,
    //},
    //delPublicUser: {
    //    error: nonreqString,
    //    foundUser: interactUserSchema,
    //    deletedUser: interactUserSchema
    //},
    //postData: {
    //    deletedPosts: [interactPostSchema],
    //    delRemovedLikes: [interactPostLikeSchema]
    //},
    //privateData: {
    //    delUserAccessTokens: [interactUserAccessSchema],
    //    delDevSettings: developerToken,
    //    delPrivUser: interactUserPrivSchema
    //},
    /*
    emailData: {
        delEmails:
    },
    pollData: {
        delVotes,
        delPolls
    },
    saves: {
        delSubs,
        delBookmarks
    }*/
});

module.exports = mongoose.model('interact-deleted-user', interactDeletedUserSchema);
