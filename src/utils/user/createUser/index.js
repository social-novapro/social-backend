const {v4 : uuidv4} = require('uuid')
const interactUserSchema = require('../../../schemas/interactUserSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const { checktime } = require('../../checktime')
const { searchError } = require('../../searchError/')

async function newUserID() {
    const newID = uuidv4()
    return doubleCheckNewID(newID)
}
async function doubleCheckNewID(newID) {
    result = await interactUserSchema.findOne({ _id: newID })
    if (result) return newUserID()
    else return newID
}

async function newUserIndex(username, displayName ) {
    const checkUsername = await interactUserSchema.findOne({username: username})
    
    if (checkUsername) return {"error" : searchError("C001")}

    const userID = await newUserID()
    const currentTime = checktime()

    await interactUserSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserSchema,
        creationTimestamp: currentTime,
        username, 
        displayName,
        followerCount: 0,
        followingCount: 0,
        likeCount: 0,
        likedCount: 0,
        totalPosts: 0,
        totalReplies: 0
    }, {
        upsert: true
    })

    return userID
}

module.exports = { newUserIndex } 