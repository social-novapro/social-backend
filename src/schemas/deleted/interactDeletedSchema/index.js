const mongoose = require('mongoose');
const { reqString, reqNum, nonreqString } = require('../../types');

const interactDeletedSchema = new mongoose.Schema({
    _id: reqString, // unique ID, deletedID
    type: reqNum, // 1=user, 2=post, .find({_id: userID, type: 1 })
    userID: reqString, // userID of deleted account or creator
    username: nonreqString // username of account 
});

module.exports = mongoose.model('interact-deletes', interactDeletedSchema);
