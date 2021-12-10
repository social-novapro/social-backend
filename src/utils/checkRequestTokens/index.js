const interactUserPrivSchema = require('../../schemas/interactUserPrivSchema')
const { checkDevTokens } = require('../checkDevTokens')
const { checkUserTokens } = require('../checkUserTokens')

async function checkRequestTokens(reqBody) {
    const { devtoken, apptoken, userid, usertoken, accesstoken } = reqBody
    const devTokensCheck = await checkDevTokens(devtoken, apptoken)
    console.log(devTokensCheck)
    if (devTokensCheck) if (devTokensCheck.authorized == false) return devTokensCheck

    const userTokensCheck = await checkUserTokens(userid, usertoken, accesstoken)
    console.log(userTokensCheck)
    if (userTokensCheck) if (userTokensCheck.authorized == false) return userTokensCheck

    return { "authrized" : true }
}

module.exports = { checkRequestTokens };