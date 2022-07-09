const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const interactSubscribeNotification = mongoose.Schema({
    _id: reqString, // userID (of person who posts)
    subscribed: [reqString] // userID (of person who subbed)
});


module.exports = mongoose.model('interact-subscribe-notifications', interactSubscribeNotification);