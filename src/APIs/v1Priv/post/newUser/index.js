const router = require('express').Router()
const { newUserIndex } = require('../../../../utils/user/createUser')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError/')
const { checkUsername } = require('../../../../utils/checks/')

router.post('/', async (req, res) => {
    const { username, displayName, password } = req.body 
    
    if (!username && !displayName) return res.status(400).send(searchError("C002"))
    else if (!username) return res.status(400).send(searchError("C003"))
    else if (!displayName) return res.status(400).send(searchError("C004"))
    else if (!password) return res.status(400).send("you must insert a password")

    const checkedUser = await checkUsername(username)
    if (checkedUser.error) return res.status(400).send(checkedUser.error)
    
    const newUserID = await newUserIndex(username, displayName, password)

    if (newUserID.error) return res.status("400").send(newUserID.error)
    const newUserData = await interactUserSchema.findOne({_id: newUserID})

    res.status(200).send(newUserData);
})

module.exports = router;
