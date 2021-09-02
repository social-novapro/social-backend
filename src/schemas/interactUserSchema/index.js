const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true
}
const reqNum = {
    type: Number,
    required: true
}

const interactUserSchema = mongoose.Schema({
    _id: reqString,
    username: reqString,
    lastEditUsername: reqNum,
    displayName: reqString,
    description: reqString,
    pronouns: reqString,
    lastEditDisplayname: reqNum,
    creationTimestamp: reqString,
    followerCount: reqNum,
    followingCount: reqNum,
    likeCount: reqNum,
    likedCount: reqNum,
    totalPosts: reqNum,
    totalReplies: reqNum
});

module.exports = mongoose.model('interact-users', interactUserSchema)