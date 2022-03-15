const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.get('/:username', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { username } = req.params;

    const UserData = await interactUserSchema.findOne({username});
    
    if (!UserData) return res.status(400).send(searchError("B012"));
    else return res.status(200).send(UserData);
})

module.exports = router;
