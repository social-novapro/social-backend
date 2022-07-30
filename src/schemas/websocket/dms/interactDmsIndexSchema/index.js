
const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

// const indexObj = mongoose.Schema({
//     _id: reqString, 
//     previousID: reqString,
//     nextID: reqString,
//     messageIDs: [reqString]
// });

const messageObj = mongoose.Schema({
    _id: reqString, // messageID
})
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