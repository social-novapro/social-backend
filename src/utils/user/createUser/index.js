const {v4 : uuidv4} = require('uuid')
const interactUserSchema = require('../../../schemas/interactUserSchema')
const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema')
const interactUserAccessSchema = require('../../../schemas/interactUserAccessSchema')
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
    result = await interactUserPrivSchema.findOne({ _id: userID})
    if (result) return newUUID("accessToken", userID)
    else return newAccessToken
}

async function newUserIndex(newUserDataForEntry) {
    const { username, displayName, password, description, pronouns, statusTitle } = newUserDataForEntry

    const userID = await newUUID("userID")
    const userToken = await newUUID("userToken")
    const accessToken = await newUUID("accessToken", userID)
    
    const currentTime = checktime()

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserPrivSchema,
        userToken,
        password
    }, {
        upsert: true
    })
    
    await interactUserAccessSchema.findOneAndUpdate({
        _id: accessToken
    }, { 
        userToken,
        userID,
        appToken: 'interact-novaproductions-main'
    }, {
        upsert: true
    })
    /*await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, { 
        $push : { accessTokens: accessToken } 
    }, {
        // new: true,
        upsert: true
    })*/

    await interactUserSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserSchema,
        username,
        lastEditUsername: currentTime,
        displayName,
        description, 
        pronouns,
        statusTitle,
        lastEditDisplayname: currentTime,
        creationTimestamp: currentTime,
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