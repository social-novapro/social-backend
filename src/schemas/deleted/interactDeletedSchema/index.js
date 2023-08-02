const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const nonreqString = {
    type: String,
    required: false
}
const reqNum = {
    type: Number,
    required: true
};

const interactDeletedSchema = new mongoose.Schema({
    _id: reqString, // unique ID, deletedID
    type: reqNum, // 1=user, 2=post, .find({_id: userID, type: 1 })
    userID: reqString, // userID of deleted account or creator
    username: nonreqString // username of account 
});

module.exports = mongoose.model('interact-deletes', interactDeletedSchema);
