const { Mongoose } = require("mongoose");
const { reqString, reqNum } = require("../../types");

const interactMovieSaveIndexSchema = Mongoose.Schema({
    _id: reqString,
    userID: reqString,
    saveIDs: [reqString],
    timestamp: reqNum,
    next_index: reqNum,
    prev_index: reqNum
});

module.exports = Mongoose.model('interact-movie-save-index-schema', interactMovieSaveIndexSchema);