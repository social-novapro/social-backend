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
    timeLeft: nonreqNum
});

const interactDmsUserGroupsSchema = mongoose.Schema({
    _id: reqString,
    groups: [groupObj],
    rooms: [groupObj]
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