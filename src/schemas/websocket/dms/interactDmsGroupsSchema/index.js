

const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const userObj = mongoose.Schema({
    _id: reqString, //userID
    timestampJoined: reqNum
});

const interactDmsGroupsSchema = mongoose.Schema({
    _id: reqString, // groupID
    groupName: reqString, 
    users: [userObj], 
    owner: reqString, // userID
    created: reqNum,
    currentIndex: reqString, // indexID
    notifications: reqNum // 1: on, 2: off, 3: mentions
});

/*
    _id: String
    users: [{userID, timestamp}]
*/

module.exports = mongoose.model('interact-dms-groups-schema', interactDmsGroupsSchema);