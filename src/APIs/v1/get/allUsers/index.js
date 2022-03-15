const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const AllUsers = await interactUserSchema.find();
    
    if (!AllUsers) return res.status(404).send(searchError("C005"));
    else return res.status(200).send(AllUsers);
})

module.exports = router;
