const router = require('express').Router()
const { newUserIndex } = require('../../../../utils/user/createUser')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError/')

router.post('/', async (req, res) => {
    const { username, displayName } = req.body 
    
    if (!username && !displayName) return res.status(400).send(searchError("C002"))
    else if (!username) return res.status(400).send(searchError("C003"))
    else if (!displayName) return res.status(400).send(searchError("C004"))

    const newUserID = await newUserIndex(username, displayName)

    if (newUserID.error) return res.status("400").send(newUserID.error)
    const newUserData = await interactUserSchema.findOne({_id: newUserID })

    res.status(200).send(newUserData);
})

module.exports = router;
