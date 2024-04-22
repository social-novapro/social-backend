const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/:username', async (req, res) => {
    const { username } = req.params;

    const UserData = await interactUserSchema.findOne({username});
    
    if (!UserData) return res.status(400).send(searchErrorV2("B012", { userID: req.headers.userid }));
    else return res.status(200).send(UserData);
})

module.exports = router;
