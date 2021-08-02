const {v4 : uuidv4} = require('uuid')
const interactUserSchema = require('../../../schemas/interactUserSchema')
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const { checktime } = require('../../checktime')
const { searchError } = require('../../searchError/')

async function newUUID(usage, userID) {
    const newID = uuidv4()
    switch (usage) {
        case "userID":
            return doubleCheckNewID(newID)
        case "userToken":
            return doubleCheckNewID(newID)
        case "accessToken":
            return doubleCheckNewAccessToken(newID, userID)
        default:
            console.log("Default")
            break
    }
}

async function doubleCheckNewID(newID) {
    result = await interactUserSchema.findOne({ _id: newID })
    if (result) return newUUID("userID")
    else return newID
}

async function doubleCheckNewAccessToken(newAccessToken, userID) {
   //  result = await interactUserSchema.find({ _id:  userID})
    if (result) return newUUID("accessToken", userID)
    else return newAccessToken
}

async function newUserIndex(username, displayName ) {
    const checkUsername = await interactUserSchema.findOne({username: username})
    console.log("1")
    if (checkUsername) return {"error" : searchError("C001")}

    const userID = await newUUID("userID")
    console.log("2")

    const userToken = await newUUID("userToken")
    console.log("3")

    const accessToken = await newUUID("accessToken", userID)
    console.log("4")

    const currentTime = checktime()

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID,
    }, {
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserPrivSchema,
        accessToken,
        userToken
    })
    console.log("5")

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