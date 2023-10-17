const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};

const interactFileSchema = mongoose.Schema({
    _id: reqString, // id of file
    type: reqString, // type of file
    filename: reqString, // filename of file
    userID: reqString, // who uploaded the file
    timestamp: reqNum, // when the file was uploaded
    views: reqNum, // +1 every time a valid call is made
});

module.exports = mongoose.model('interact-file', interactFileSchema);