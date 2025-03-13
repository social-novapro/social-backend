const { checkDevTokens } = require("../checkDevTokens");
const { checkRequestTokens } = require("../checkRequestTokens");

async function authV1(req, res, next) {
    console.log('----');
    console.log(req.originalUrl)
    if ( 
        req.originalUrl.startsWith('/v1/serverStatus') ||
        req.originalUrl.startsWith('/v1/get/analyticTrend') ||
        req.originalUrl.startsWith('/v1/emails/requests') ||
        req.originalUrl.startsWith('/v1/users/public') || 
        req.originalUrl.startsWith('/v1/auth/password/requests') ||
        /* actions for db updates, only to be done once */
        req.originalUrl.startsWith('/v1/admin/updateActions') ||
        /* cdn static */
        req.originalUrl.startsWith('/v1/cdn/static/') 
    ) {
        console.log("authV1: bypassing auth")
        return next();
    } else if (
        req.originalUrl == '/v1/auth/userLogin' || 
        req.originalUrl == '/v1/auth/userLogin/' ||
        req.originalUrl == '/v1Priv/post/newUser' ||
        req.originalUrl == '/v1Priv/post/newUser/' || 
        req.originalUrl == '/v1/auth/password/forgot' ||
        req.originalUrl == '/v1/auth/password/forgot/'
    ) {
        console.log("authV1: bypassing user auth")
        const { devtoken, apptoken } = req.headers;
        const tokenData = await checkDevTokens(devtoken, apptoken);
        if (tokenData.authorized === false) return res.status(401).send(tokenData);
        else return next();
    } else {
        console.log("authV1: checking auth")
        const tokenData = await checkRequestTokens(req);
        if (tokenData.authorized == false) return res.status(401).send(tokenData);
        else return next();
    }
}

module.exports = {authV1};