const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.get('/:userID', async (req, res) => {
    const { userID } = req.params
    
    const UserData = await interactUserSchema.findOne({_id: userID})

    if (!UserData) return res.status(404).send({msg: "The provided userID is not valid."})
    else return res.status(200).send(UserData);
})

module.exports = router;
