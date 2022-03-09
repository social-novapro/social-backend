const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema')
const interactUserAccessSchema = require('../../schemas/interactUserAccessSchema')
const { searchError } = require('../searchError')

async function checkUserTokens(userID, userToken, accessToken, appToken) {
    if (!userID && !userToken && !accessToken) return { "authorized": false, "error" : searchError("B005") }
    if (!userID && !userToken) return { "authorized": false, "error" : searchError("B006") }
    if (!userID && !accessToken) return { "authorized": false, "error" : searchError("B007") }
    if (!userToken && !accessToken) return { "authorized": false, "error" : searchError("B008") }
    if (!userID) return { "authorized": false, "error" : searchError("B009") }
    if (!userToken) return { "authorized": false, "error" : searchError("B010") }
    if (!accessToken) return { "authorized": false, "error" : searchError("B011") }
    // if (!userTokenCorrect) return { "authorized": false, "error" : searchError("B003") }
    // if (!accessTokenCorrect) return { "authorized": false, "error" : searchError("B004")}

    const checkPrivUser = await interactUserPrivSchema.findOne({_id: userID})
    if (!checkPrivUser) return { "authorized": false, "error" : searchError("B001") }
    
    const foundAccessToken = await interactUserAccessSchema.findOne({ appToken, userID, userToken })
    if (!foundAccessToken) return { "authorized": false, "error" : searchError("B013") }

    const userTokenCorrect = (checkPrivUser.userToken === userToken)
    const accessTokenCorrect = (foundAccessToken._id === accessToken)

    if (!userTokenCorrect && !accessTokenCorrect) return { "authorized": false, "error" : searchError("B002") }
    else if (!userTokenCorrect) return { "authorized": false, "error" : searchError("B003") }
    else if (!accessTokenCorrect) return { "authorized": false, "error" : searchError("B004")}
    
    return { "authorized": true }
}

module.exports = { checkUserTokens };
