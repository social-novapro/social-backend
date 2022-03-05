const interactUserAccessSchema = require('../../../schemas/interactUserAccessSchema')
const { SCHEMA_VERSIONS } = require('../../../../config.json')
const {v4 : uuidv4} = require('uuid')

async function createAccessToken(userID, userToken, appToken) {
    const foundAppAccess = await interactUserAccessSchema.findOne({ appToken, userID, userToken })

    if (foundAppAccess) return foundAppAccess
    else {
        const accessToken = uuidv4()
    
        await interactUserAccessSchema.findOneAndUpdate({
            _id: accessToken
        }, { 
            __v: SCHEMA_VERSIONS.interactUserAccessSchema,
            userToken,
            userID,
            appToken
        }, {
            upsert: true
        })
        
        const checkingToken = await interactUserAccessSchema.findOne({_id: accessToken})
        
        return checkingToken
    }
}

module.exports = { createAccessToken }