const router = require('express').Router()
const { newDeveloperAppToken } = require('../../../../utils/developer/create/appToken')
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid, userdevtoken } = req.headers;
    if (!userdevtoken) return res.status(401).send({'error': "You must include userdevtoken inside your headers to create a new token."})
    
    const newAppToken = await newDeveloperAppToken(userid, userdevtoken);
    
    const newTokenData = await developerAppToken.findOne({ _id: newAppToken });
    if (!newTokenData) return res.status(404).send({'error': "Could not find created app id."})
    res.status(200).send(newTokenData);
});

module.exports = router;