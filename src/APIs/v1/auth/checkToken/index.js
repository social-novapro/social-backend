const router = require('express').Router()
const { checkDevTokens } = require('../../../../utils/checkDevTokens')
const { createAccessToken } = require('../../../../utils/user/createAccessToken')

router.get('/', async (req, res) => {
    const { devtoken, apptoken, usertoken, userid } = req.headers

    const tokenData = await checkDevTokens(devtoken, apptoken)
    if (tokenData.authorized === false) return res.status(401).send(tokenData)

    const checkingToken = await interactUserAccessSchema.findOne({userID})
    console.log(checkingToken)
    
    const token = await createAccessToken(userid, usertoken, apptoken)
    console.log(token)
});

module.exports = router;