const { checkDevTokens } = require("../checkDevTokens");
const { checkRequestTokens } = require("../checkRequestTokens");

async function authV1(req, res, next) {
    if (req.originalUrl == '/v1/auth/userLogin') {
        const { devtoken, apptoken } = req.headers;
        const tokenData = await checkDevTokens(devtoken, apptoken);
        if (tokenData.authorized === false) return res.status(401).send(tokenData);
        else return next();
    } else {
        const tokenData = await checkRequestTokens(req);
        if (tokenData.authorized == false) return res.status(401).send(tokenData);
        else return next();
    }
}

module.exports = {authV1};