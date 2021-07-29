const router = require('express').Router()
const { newDeveloperToken } = require('../../../../utils/developer/create/devToken')
const developerToken = require('../../../../schemas/developer/developerToken')

router.post('/:userID', async (req, res) => {
    const { userID } = req.params
    
    /*
    const { userID, userToken, accessToken } = req.body 
    
    if (!username && !displayName) return res.status(400).send({msg: "You must provide the new user's username and displayName in order to create a user."})
    else if (!username) return res.status(400).send({msg: "You must provide the new user's username in order to create a user."})
    else if (!displayName) return res.status(400).send({msg: "You must provide the new user's displayName in order to create a user."})
    */

    const newDevToken = await newDeveloperToken()

    await developerToken.findOneAndUpdate({
        _id: newDevToken
    }, {
        userID,
    }, {
        upsert: true
    })
    const newTokenData = await developerToken.findOne({ _id: newDevToken }) 

    res.status(200).send(newTokenData);
})

module.exports = router;
