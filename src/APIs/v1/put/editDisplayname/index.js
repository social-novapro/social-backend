const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens')
const { checktime } = require('../../../../utils/checktime')

router.put('/', async (req, res) => {
    const { newdisplayname, userid } = req.headers 
    const checkTokens = await checkRequestTokens(req.headers)

    if (checkTokens) if (checkTokens.authorized==false) return res.status(400).send(checkTokens)

    if (!newdisplayname && !userid) return res.status(400).send("no displayname and userID provided.")//searchError("E002"))
    else if (!newdisplayname) return res.status(400).send("no displayname provided.")//searchError("E002"))
    else if (!userid) return res.status(400).send("no userid")//searchError("E003"))

    // const checkedUser = await checkUsername(newDisplayname)
    // if (checkedUser.error) return res.status(400).send(checkedUser.error)

    const userIDCheck = await interactUserSchema.findOne({ _id: userid})
    if (!userIDCheck) return res.status(403).send(searchError("E004"))
    

    var lastEdited = 0
    if (!userIDCheck.lastEditDisplayname) lastEdited = 0
    else lastEdited = userIDCheck.lastEditDisplayname

    const currenttime = checktime()
    const timediff = currenttime - lastEdited
    const firstMinutes = Math.floor(timediff / 60000) % 60;
    const firstSeconds = Math.floor(timediff / 1000) % 60;

    const minutes = 29 - firstMinutes
    const seconds = 59 - firstSeconds

    var timeuntil
    if (!minutes) timeuntil = `${seconds} seconds`
    else timeuntil = `${minutes} minutes and ${seconds} seconds`

    if (timediff < 1800000) return res.status(400).send(`You must wait ${timeuntil} before changing again.`)//searchError("E004"))

    const UserData = await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { displayName: newdisplayname, lastEditDisplayname: currenttime }, 
        { new: true, upsert: true }
    )

    if (!UserData) return res.status(404).send("no user found")//searchError("D002"))
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck});
})

module.exports = router;
