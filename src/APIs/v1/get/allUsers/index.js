const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/', async (req, res) => {
    const AllUsers = await interactUserSchema.find();
    
    if (!AllUsers) return res.status(404).send(searchErrorV2("C005", { userID : req.headers.userid }));
    else return res.status(200).send(AllUsers);
})

module.exports = router;
