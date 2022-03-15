const router = require('express').Router();
const { newDeveloperToken } = require('../../../../utils/developer/create/devToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;

    if (!userID) return res.status(400).send("No userID provided");

    const userData = await interactUserSchema.findOne({_id: userID});
    if (!userData) return res.status(400).send("no user found");

    const tokenSearch = await developerToken.findOne({userID});
    if (tokenSearch) return res.status(400).send("Token already exists for this user. ");

    const newDevToken = await newDeveloperToken(userID);
    const newTokenData = await developerToken.findOne({ _id: newDevToken }); 

    res.status(200).send(newTokenData);
})

module.exports = router;
