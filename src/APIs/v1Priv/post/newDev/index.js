const router = require('express').Router();
const { newDeveloperToken } = require('../../../../utils/developer/create/devToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers;
    const userID = userid;
    // const { userID } = req.params;

    if (!userID) return res.status(400).send(searchErrorV2("B009", { userID }));

    const userData = await interactUserSchema.findOne({_id: userID});
    if (!userData) return res.status(400).send(searchErrorV2("C009", { userID }));

    const tokenSearch = await developerToken.findOne({userID});
    if (tokenSearch) return res.status(400).send(searchErrorV2("A009", { userID }));

    const newDevToken = await newDeveloperToken(userID);
    const newTokenData = await developerToken.findOne({ _id: newDevToken }); 

    res.status(200).send(newTokenData);
})

module.exports = router;
