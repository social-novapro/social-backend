const router = require('express').Router()
const { newDeveloperAppToken } = require('../../../../utils/developer/create/appToken')
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;
    const { userdevtoken, appname } = req.body;
    
    if (!userdevtoken) return res.status(401).send(searchErrorV2("A011", { userID: userid }));
    if (!appname) return res.status(401).send(searchErrorV2("A011", { userID: userid }));
    
    const foundDevtoken = await developerToken.findOne({_id: userdevtoken })
    if (!foundDevtoken) return res.status(401).send(searchErrorV2("A002", { userID: userid }))

    if (foundDevtoken.userID != userid) return res.status(401).send(searchErrorV2("B003", { userID: userid }))
    const newAppToken = await newDeveloperAppToken(userid, userdevtoken, appname);
    
    const newTokenData = await developerAppToken.findOne({ _id: newAppToken });
    if (!newTokenData) return res.status(404).send(searchErrorV2("A008", { userID: userid }))

    return res.status(200).send(newTokenData);
});

module.exports = router;