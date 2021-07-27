const {v4 : uuidv4} = require('uuid')
const interactUserSchema = require('../../../schemas/interactUserSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const { checktime } = require('../../checktime')

async function newUserID() {
    const newID = uuidv4()
    return doubleCheckNewID(newID)
}
async function doubleCheckNewID(newID) {
    result = await interactUserSchema.findOne({ _id: newID })
    if (result) return newUserID()
    else return newID
}

async function newUserIndex() {
    const userID = await newUserID("new")
    const currentTime = checktime()
    await interactUserSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserSchema,
        creationData: currentTime
    }, {
        upsert: true
    })
    
    return userID
}

module.exports = { newUserIndex } 