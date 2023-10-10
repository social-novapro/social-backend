const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true
};

const reqNum = {
    type: Number,
    required: true
};

/*
postSchema
    -> indexSchema
 | interactQuotesSchema -> 
//  | interactQuotesSchema -> postSchema
*/
const interactQuotesSchema = mongoose.Schema({
    _id: reqString, // indexID
    postID: reqString, // main post
    amount: reqNum,
    previousIndex: reqString,
    nextIndex: reqString, 
    postIDs: [reqString], //postID of reply
    indexStartTime: reqString,// when index was created
    indexEndTime: reqString
});

module.exports = mongoose.model('interact-quotes', interactQuotesSchema);