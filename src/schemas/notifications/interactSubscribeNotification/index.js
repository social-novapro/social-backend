const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};

const userSub = mongoose.Schema({
    _id: reqString, // userID (of person who subbed)
    timestamp: reqNum // time subscribed
});

const interactSubscribeNotification = mongoose.Schema({
    _id: reqString, // userID (of person who posts)
    subscribed: [userSub] 
});


module.exports = mongoose.model('interact-subscribe-notifications', interactSubscribeNotification);