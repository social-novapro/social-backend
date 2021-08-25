const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const {checkDevTokens} = require('../../../../utils/checkDevTokens')
const { searchError } = require('../../../../utils/searchError')

router.get('/:userID', async (req, res) => {
    const { userID } = req.params
    const { devtoken, apptoken } = req.headers
    const tokenData = await checkDevTokens(devtoken, apptoken)
    if (tokenData.authorized === false) return res.status(401).send(tokenData)
    

    const UserData = await interactUserSchema.findOne({_id: userID})

    if (!UserData) return res.status(400).send(searchError("B001"))
    else return res.status(200).send(UserData);
})

module.exports = router;
