
const mongoose = require('mongoose');
const { reqString } = require('../../../types');

const interactDmsIndexSchema = mongoose.Schema({
    _id: reqString, // indexID
    // currentIndex: reqString,
    // indexes: [indexObj],
    previousID: reqString, // indexID
    nextID: reqString, // indexID
    messageIDs: [reqString] // messageID
});

/*
    _id (from groups)
    currentIndex
    indexes: [
        {
            _id,
            previousID,
            nextID,
            messageIDs: []
        }
    ]
*/

module.exports = mongoose.model('interact-dms-index-schema', interactDmsIndexSchema);