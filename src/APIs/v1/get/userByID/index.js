const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({_id: userID});

    if (!UserData) return res.status(400).send(searchErrorV2("B001", { userID }));
    else return res.status(200).send(UserData);
});

module.exports = router;
