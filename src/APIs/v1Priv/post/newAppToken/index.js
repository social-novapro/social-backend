const router = require('express').Router()
const { newDeveloperAppToken } = require('../../../../utils/developer/create/appToken')
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid, userdevtoken, appname } = req.headers;
    if (!userdevtoken) return res.status(401).send(searchError("A011"));
    if (!appname) return res.status(401).send(searchError("A011"));
    
    const foundDevtoken = await developerToken.findOne({_id: userdevtoken })
    if (!foundDevtoken) return res.status(401).send(searchError("A002"))

    if (foundDevtoken.userID != userid) return res.status(401).send(searchError("B003"))
    const newAppToken = await newDeveloperAppToken(userid, userdevtoken, appname);
    
    const newTokenData = await developerAppToken.findOne({ _id: newAppToken });
    if (!newTokenData) return res.status(404).send(searchError("A008"))

    return res.status(200).send(newTokenData);
});

module.exports = router;