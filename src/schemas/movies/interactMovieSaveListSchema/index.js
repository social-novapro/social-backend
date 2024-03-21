const { Mongoose } = require("mongoose");
const { reqString, reqNum, reqBool } = require("../../types");

const interactMovieSaveListSchema = Mongoose.Schema({
    _id: reqString,
    userID: reqString,
    public: reqBool,
    timestamp: reqNum,
    last_updated: reqNum,
});

module.exports = Mongoose.model('interact-movie-save-listschema', interactMovieSaveListSchema);