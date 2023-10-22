const mongoose = require('mongoose');
const { reqString, reqNum } = require('../../types');

/*
postSchema
    -> indexSchema
 | InteractReplyIndex -> 
//  | InteractReplySchema -> postSchema
*/
const interactRepliesSchema = mongoose.Schema({
    _id: reqString, // indexID
    postID: reqString, // main post
    amount: reqNum,
    previousIndex: reqString,
    nextIndex: reqString, 
    postIDs: [reqString], //postID of reply
    indexStartTime: reqString,// when index was created
    indexEndTime: reqString
});

module.exports = mongoose.model('interact-replies', interactRepliesSchema);