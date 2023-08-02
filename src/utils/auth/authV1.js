const { checkDevTokens } = require("../checkDevTokens");
const { checkRequestTokens } = require("../checkRequestTokens");

async function authV1(req, res, next) {
    console.log(req.originalUrl)
    if ( 
        req.originalUrl.startsWith('/v1/get/analyticTrend') ||
        req.originalUrl.startsWith('/v1/emails/requests') ||
        req.originalUrl.startsWith('/v1/users/public')
    ) {
        console.log("authV1: bypassing auth")
        return next();
    } else if (
        req.originalUrl == '/v1/auth/userLogin' || 
        req.originalUrl == '/v1/auth/userLogin/' ||
        req.originalUrl == '/v1Priv/post/newUser' ||
        req.originalUrl == '/v1Priv/post/newUser/'
    ) {
        console.log("authV1: bypassing user auth")
        const { devtoken, apptoken } = req.headers;
        const tokenData = await checkDevTokens(devtoken, apptoken);
        if (tokenData.authorized === false) return res.status(401).send(tokenData);
        else return next();
    } else {
        console.log("authV1: checking auth")
        const tokenData = await checkRequestTokens(req, true);
        if (tokenData.authorized == false) return res.status(401).send(tokenData);
        else return next();
    }
}

module.exports = {authV1};