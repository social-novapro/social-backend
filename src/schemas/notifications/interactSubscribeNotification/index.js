const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

const userSub = mongoose.Schema({
    _id: reqString, // userID (of person who subbed)
    timestamp: reqNum // time subscribed
});

const interactSubscribeNotification = mongoose.Schema({
    _id: reqString, // userID (of person who posts)
    subscribed: [userSub] 
});


module.exports = mongoose.model('interact-subscribe-notifications', interactSubscribeNotification);