const router = require('express').Router()
const { newDeveloperAppToken } = require('../../../../utils/developer/create/appToken')
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid, devtoken } = req.headers;

    const newAppToken = await newDeveloperAppToken(userid, devtoken);
    
    const newTokenData = await developerAppToken.findOne({ _id: newAppToken });
    res.status(200).send(newTokenData);
});

module.exports = router;