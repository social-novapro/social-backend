const { checkDevTokens } = require('../checkDevTokens');
const { checkUserTokens } = require('../checkUserTokens');
const {analytics} = require('../analytics');

async function checkRequestTokens(req, withoutAnalytic) {
    const reqHeader = req.headers;
    const { devtoken, apptoken, userid, usertoken, accesstoken } = reqHeader;
    const devTokensCheck = await checkDevTokens(devtoken, apptoken);
    if (devTokensCheck) if (devTokensCheck.authorized == false) return devTokensCheck;

    const userTokensCheck = await checkUserTokens(userid, usertoken, accesstoken, apptoken);
    if (userTokensCheck) if (userTokensCheck.authorized == false) return userTokensCheck;

    if (withoutAnalytic == true ) {
        return { "authrized" : true };
    } else {
        await analytics(req);
        return { "authrized" : true };
    }
}

module.exports = { checkRequestTokens };