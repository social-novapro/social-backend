const router = require('express').Router()
const { newUserIndex } = require('../../../../utils/user/createUser')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError/')
const { checkUsername } = require('../../../../utils/checks/')
const { checkDevTokens } = require('../../../../utils/checkDevTokens')

router.post('/', async (req, res) => {
    const { devtoken, apptoken} = req.headers

    const tokenData = await checkDevTokens(devtoken, apptoken)
    if (tokenData.authorized === false) return res.status(401).send(tokenData)
    
    const { username, displayName, password, description, pronouns, statusTitle } = req.body 

    if (!username && !displayName) return res.status(400).send(searchError("C002"))
    else if (!username) return res.status(400).send(searchError("C003"))
    else if (!displayName) return res.status(400).send(searchError("C004"))
    else if (!password) return res.status(400).send(searchError("C006"))

    const checkedUser = await checkUsername(username)
    if (checkedUser.error) return res.status(400).send(checkedUser.error)
    
    const newUserDataForEntry = { username, displayName, password, description, pronouns, statusTitle, devToken: devtoken, appToken: apptoken }   
    const newUserID = await newUserIndex(newUserDataForEntry)

    if (newUserID.error) return res.status("400").send(newUserID.error)
    const newUserData = await interactUserSchema.findOne({_id: newUserID})

    res.status(200).send(newUserData);
})

module.exports = router;
