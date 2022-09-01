const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};
const nonreqNum = {
    type: Number,
    required: false
};

const groupObj = mongoose.Schema({
    _id: reqString, //group id
    timestamp: reqNum, // time entered
    notifications: reqNum, // 1: on, 2: off, 3: mentions, 4: default
    timeLeft: nonreqNum
});

const interactDmsUserGroupsSchema = mongoose.Schema({
    _id: reqString,
    groups: [groupObj],
    rooms: [groupObj],
    lastOpened: reqString
});

/*
    _id // userid
    groups: [
        {
        }
    ],
    rooms: [

    ]
*/

module.exports = mongoose.model('interact-dms-user-groups-schema', interactDmsUserGroupsSchema);