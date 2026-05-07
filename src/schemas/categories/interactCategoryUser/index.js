const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString, nonreqNum, nonreqBool } = require('../../types');

const interactCategoryUserSchema = mongoose.Schema({
    _id: reqString, // uuid
    userID: reqString,
    categoryID: reqNum, // ID of the category
    userScore: nonreqNum,
    isUserSet: nonreqBool, // did the user set a score for this category, or not
    autoScore: nonreqNum, // auto score
    timestamp: reqNum, // last edited
    
    amountLikes: nonreqNum, // amount of likes
    amountPosts: nonreqNum, // amount of posts
    amountReplies: nonreqNum, // amount of replies
    amountQuotes: nonreqNum, // amount of quotes
});

module.exports = mongoose.model('interact-category-user', interactCategoryUserSchema);