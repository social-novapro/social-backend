const interactUserPrivSchema = require('../../../schemas/interactUserPrivSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const {v4 : uuidv4} = require('uuid')

async function createAccessToken(userID) {
    const accessToken = uuidv4()

    await interactUserPrivSchema.findOneAndUpdate({
        _id: userID
    }, { 
        $push : { accessTokens: accessToken } 
    }, {
        upsert: true
    })
}

module.exports = { createAccessToken }