const interactUserAccessSchema = require('../../../schemas/interactUserPrivSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const {v4 : uuidv4} = require('uuid')

async function createAccessToken(userID, userToken, accessToken) {
    const accessToken = uuidv4()

    await interactUserAccessSchema.findOneAndUpdate({
        _id: accessToken
    }, { 
        userToken,
        userID,
        appToken: 'interact-novaproductions-main'
    }, {
        upsert: true
    })
}

module.exports = { createAccessToken }