const { checkDevTokens } = require('../checkDevTokens')
const { checkUserTokens } = require('../checkUserTokens')

async function checkRequestTokens(reqHeader) {
    const { devtoken, apptoken, userid, usertoken, accesstoken } = reqHeader
    const devTokensCheck = await checkDevTokens(devtoken, apptoken)
    if (devTokensCheck) if (devTokensCheck.authorized == false) return devTokensCheck

    const userTokensCheck = await checkUserTokens(userid, usertoken, accesstoken, apptoken)
    if (userTokensCheck) if (userTokensCheck.authorized == false) return userTokensCheck

    return { "authrized" : true }
}

module.exports = { checkRequestTokens };