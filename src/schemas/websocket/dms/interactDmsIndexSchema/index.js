
const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

const indexObj = mongoose.Schema({
    _id: reqString, 
    previousID: reqString,
    nextID: reqString,
    messageIDs: [reqString]
});

const interactDmsIndexSchema = mongoose.Schema({
    _id: reqString, // 
    currentIndex: reqString,
    indexes: [indexObj],
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