const { checkDevTokens } = require("../checkDevTokens");
const { checkRequestTokens } = require("../checkRequestTokens");
const { createRateLimiter } = require("../rateLimit");

const generalRateLimit = createRateLimiter({
    name: 'general-api',
    windowMs: 15 * 60 * 1000,
    max: 600
});

const authRateLimit = createRateLimiter({
    name: 'auth-api',
    windowMs: 10 * 60 * 1000,
    max: 30
});

const signupRateLimit = createRateLimiter({
    name: 'signup-api',
    windowMs: 60 * 60 * 1000,
    max: 5
});

const emailRateLimit = createRateLimiter({
    name: 'email-api',
    windowMs: 60 * 60 * 1000,
    max: 20
});

function applyRateLimit(req, res, next) {
    const url = req.originalUrl;

    if (
        url === '/v1Priv/post/newUser' ||
        url === '/v1Priv/post/newUser/'
    ) {
        return signupRateLimit(req, res, next);
    }

    if (
        url.startsWith('/v1/emails') ||
        url.startsWith('/v1/auth/password')
    ) {
        return emailRateLimit(req, res, next);
    }

    if (url.startsWith('/v1/auth')) {
        return authRateLimit(req, res, next);
    }

    if (
        url.startsWith('/v1') ||
        url.startsWith('/v1Priv') ||
        url.startsWith('/API')
    ) {
        return generalRateLimit(req, res, next);
    }

    return next();
}

async function authV1(req, res, next) {
    console.log('----');
    console.log(req.originalUrl)
    return applyRateLimit(req, res, async () => {
    if ( 
        req.originalUrl.startsWith('/v1/serverStatus') ||
        req.originalUrl.startsWith('/v1/get/analyticTrend') ||
        req.originalUrl.startsWith('/v1/emails/requests') ||
        req.originalUrl.startsWith('/v1/users/public') || 
        req.originalUrl.startsWith('/v1/auth/password/requests') ||
        /* actions for db updates, only to be done once */
        req.originalUrl.startsWith('/v1/admin/updateActions') ||
        /* cdn static */
        req.originalUrl.startsWith('/v1/cdn/static/')  ||
        req.originalUrl.startsWith('/v1/cdn/file/') ||
        req.originalUrl.startsWith('/v1/video_embed/') 
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
    });
}

module.exports = {authV1};
