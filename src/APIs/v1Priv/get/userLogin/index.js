const router = require('express').Router()
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema')

router.get('/', async (req, res) => {
    const { username, password } = req.headers

    if (!username) return res.status(403).send("no username provided");
    if (!password) return res.status(403).send("no password provided");

    const foundUsername = await interactUserSchema.findOne({username})
    if (!foundUsername) return res.status(403).send("unable to find username provided");
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUsername._id})
    if (!foundPrivUser) return res.status(403).send("unable to find username provided");

    if (foundPrivUser.password != password) return res.status(403).send("password provided was incorreect");
    
    res.status(200).send({"login" : true, "priv" : foundPrivUser, "public" : foundUsername});
})

module.exports = router;