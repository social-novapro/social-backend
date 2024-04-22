const { checkDevTokens } = require('../checkDevTokens');
const { checkUserTokens } = require('../checkUserTokens');

async function checkRequestTokens(req) {
    const reqHeader = req.headers;
    const { devtoken, apptoken, userid, usertoken, accesstoken } = reqHeader;
    const devTokensCheck = await checkDevTokens(devtoken, apptoken);
    if (devTokensCheck) if (devTokensCheck.authorized == false) return devTokensCheck;

    const userTokensCheck = await checkUserTokens(userid, usertoken, accesstoken, apptoken);
    if (userTokensCheck) if (userTokensCheck.authorized == false) return userTokensCheck;

    return { authorized: true };
}

module.exports = { checkRequestTokens };