const router = require('express').Router()
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema')
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')

router.get('/', async (req, res) => {
    const { username, password } = req.headers

    if (!username) return res.status(403).send(searchError("G001"));
    if (!password) return res.status(403).send(searchError("G002"));

    const foundUsername = await interactUserSchema.findOne({username})
    if (!foundUsername) return res.status(403).send(searchError("G003"));
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUsername._id})
    if (!foundPrivUser) return res.status(403).send(searchError("G004"));

    if (foundPrivUser.password != password) return res.status(403).send(searchError("G005"));
    
    res.status(200).send({"login" : true, "priv" : foundPrivUser, "public" : foundUsername});
})

module.exports = router;