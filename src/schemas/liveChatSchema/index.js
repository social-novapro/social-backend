const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}

const reqNum = {
    type: Number,
    required: true
}

const reqBool = {
    type: Boolean,
    required: true
}

// type 01
const pingsSchema = mongoose.Schema({
    alive: reqBool
})

// type 02
const messageSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqString
})

// type 06
const userJoinSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqString
})

// type 07
const userLeaveSchema = mongoose.Schema({
    userID: reqString,
    user: reqString,
    currentUsers: reqString,
    content: reqString,
    timeStamp: reqString
})

const interactLiveChatSchema = mongoose.Schema({
    _id: reqString,
    type: reqNum,
    apiVersions: reqString,
    pings: pingsSchema, 
    message: messageSchema,
    userJoin: userJoinSchema,
    userLeave: userLeaveSchema
});

module.exports = mongoose.model('interact-live-chat', interactLiveChatSchema)