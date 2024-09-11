const mongoose = require('mongoose');
const { reqBool, reqString, reqNum } = require('../types');

// type 01
const pingsSchema = mongoose.Schema({
    alive: reqBool
});

// type 02
const messageSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqNum,
    replyTo: reqString, // messageID
    edited: reqBool,
    editedTimeStamp: reqNum
});

// type 06
const userJoinSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqNum
});

// type 07
const userLeaveSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqNum
});

// user
const userSchema = mongoose.Schema({
    _id: reqString,
    username: reqString,
    displayName: reqString,
});

const interactLiveChatSchema = mongoose.Schema({
    _id: reqString,
    type: reqNum,
    user: userSchema,
    apiVersions: reqString,
    pings: pingsSchema, 
    message: messageSchema,
    userJoin: userJoinSchema,
    userLeave: userLeaveSchema
});

module.exports = mongoose.model('interact-live-chat', interactLiveChatSchema);