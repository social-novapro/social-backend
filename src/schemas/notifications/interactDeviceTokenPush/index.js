const mongoose = require('mongoose');
const { reqString, reqNum, reqBool, nonreqBool } = require('../../types');

const interactDeviceTokenPush = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString, // userID
    deviceToken: reqString, // deviceToken
    timestamp: reqNum, // timestamp of device added
    deviceType: reqString, // deviceType

    notifications: nonreqBool, // if device should receive ANY notifications
    subscription: nonreqBool, // if device should receive sub notifications
    newsLetter: nonreqBool, // if device should receive newsletter
    alerts: nonreqBool, // if device should receive alerts
    replies: nonreqBool, // if device should receive replies
    mentions: nonreqBool, // if device should receive mentions
    likes: nonreqBool, // if device should receive likes
    quotes: nonreqBool, // if device should receive quotes
    coposts: nonreqBool, // if device should receive coposts
    mentions: nonreqBool, // if device should receive mentinos
    allPosts: nonreqBool, // if device should receive all posts
    allMessages: nonreqBool, // if device should receive all messages
});

module.exports = mongoose.model('interact-device-token-push-schema', interactDeviceTokenPush);