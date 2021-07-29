const developerToken = require('../../schemas/developer/developerToken')
const developerAppToken = require('../../schemas/developer/developerAppToken')
const { searchError } = require('../searchError')

async function checkDevTokens(devToken, appToken) {
    if (!devToken && !appToken) return { "authorized": false, "error" : searchError("A004")}
    if (!devToken) return { "authorized": false, "error" : searchError("A005")}
    if (!appToken) return { "authorized": false, "error" : searchError("A006")}

    const checkDevToken = await developerToken.findOne({_id: devToken})
    const checkAppToken = await developerAppToken.findOne({_id: appToken})
    
    if (!checkDevToken && !checkAppToken) return { "authorized": false, "error" : searchError("A001")}
    else if (!checkDevToken) return { "authorized": false, "error" : searchError("A002")}
    else if (!checkAppToken) return { "authorized": false, "error" : searchError("A003")}
    
    await developerToken.findOneAndUpdate({_id: devToken}, { APIUses: APIUses + 1  })
    await developerAppToken.findOneAndUpdate({_id: appToken}, { APIUses: APIUses + 1  })

    return { "authorized": true }
}

module.exports = { checkDevTokens };