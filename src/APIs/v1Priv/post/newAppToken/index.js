const router = require('express').Router()
const { newDeveloperAppToken } = require('../../../../utils/developer/create/appToken')
const developerAppToken = require('../../../../schemas/developer/developerAppToken')
const developerToken = require('../../../../schemas/developer/developerToken')
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.post('/', async (req, res) => {
    const { userid, devtoken } = req.headers
    
    if (!userid && !devtoken) return res.status(400).send("No devtoken provided, and no userID provided");
    else if (!userid) return res.status(400).send("No userID");
    else if (!devtoken) return res.status(400).send("No dev token provided");

    const tokenData = await developerToken.findOne({_id: devtoken})
    const userData = await interactUserSchema.findOne({_id: userid})

    if (!tokenData && !userData) return res.status(400).send("No tokenData, and no userData");
    else if (!userData) return res.status(400).send("No userData");
    else if (!tokenData) return res.status(400).send("No tokenData");

    const newAppToken = await newDeveloperAppToken(userid, devtoken)
    
    const newTokenData = await developerAppToken.findOne({ _id: newAppToken }) 

    res.status(200).send(newTokenData);
})

module.exports = router;
