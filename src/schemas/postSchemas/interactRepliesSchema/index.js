const mongoose = require('mongoose');
const { reqString, reqNum, nonreqNum } = require('../../types');

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
    indexStartTime: reqNum,// when index was created
    indexEndTime: nonreqNum
});

module.exports = mongoose.model('interact-replies', interactRepliesSchema);