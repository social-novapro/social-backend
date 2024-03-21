const { Mongoose } = require("mongoose");
const { reqString, reqNum } = require("../../types");

const interactMovieSaveSchema = Mongoose.Schema({
    _id: reqString,
    userID: reqString,
    traktID: reqString,
    imdbID: reqString,
    timestamp: reqNum,
    watchCount: reqNum
});

module.exports = Mongoose.model('interact-movies-save-schema', interactMovieSaveSchema);