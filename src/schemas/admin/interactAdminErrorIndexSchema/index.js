const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};
const reqNum = {
    type: Number,
    required: true
};

const nonreqString = {
    type: String,
    required: false
}

const errorIndexSchema = mongoose.Schema({
    _id: nonreqString,
    // timestamp
})

const interactAdminErrorIndexSchema = mongoose.Schema({
    _id: reqString, // indexID (for errors)
    amount: reqNum,
    timestamp: reqNum,
    prevIndexID: nonreqString,
    nextIndexID: nonreqString,
    errorIssues: [errorIndexSchema]
    /*
        issue is in review
        then is resolved (or resolved if nothing to do)
    */
});

module.exports = mongoose.model('interact-admin-error-index', interactAdminErrorIndexSchema);