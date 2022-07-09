const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonReqstring = {
    type: String,
    required: false
}
const reqNum = {
    type: Number,
    required: true
};

const interactNotifications = mongoose.Schema({
    /*
        _id: notificationID
        timestamp: Num

        type: String (one)
            1: someone followed
            2: someone unfollowed
            3: someone liked post
            4: someone unliked post
            5: someone posted
            6: someone mentioned you
        type1: Object
            userID
        type2: Object
            userID
        type3:
            userID
            postID
        type4:
            userID
            postID
        type5:
            userID
            postID
        type6: 
            userID
            postID
    */
    _id: reqString,
    timestamp: reqNum,
    type: reqNum,
    userID: reqString,
    postID: nonReqstring
});

module.exports = mongoose.model('interact-notifications', interactNotifications);