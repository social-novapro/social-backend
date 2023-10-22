const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../../types');

const editsObj = mongoose.Schema({
    _id: reqString, 
    newContent: reqString,
    oldContent: reqString,
    timestamp: reqNum // time followed
});

const interactDmsMessagesSchema = mongoose.Schema({
    _id: reqString,
    indexID: reqString,
    userID: reqString,
    groupID: reqString,
    content: reqString,
    timestamp: reqNum,
    edits: [editsObj] 
});

/*
    _id (of message)
    userID
    content
    timestamp
    reactions : [
        {
            // not now
            timestamp
            content
        }
    ]
    edits: [
        {
            newContent
            oldContent
            timestamp
        }
    ]
*/

module.exports = mongoose.model('interact-dms-messages-schema', interactDmsMessagesSchema);