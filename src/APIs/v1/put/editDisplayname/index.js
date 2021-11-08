const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema')
const { searchError } = require('../../../../utils/searchError')
// const { checkUsername } = require('../../../../utils/checks')
const { checktime } = require('../../../../utils/checktime')

router.put('/', async (req, res) => {
    const { newDisplayname, userID, userToken } = req.body 
    
    if (!newDisplayname && !userID && !userToken) return res.status(400).send("no displayname, userid, and userToken was provided")//searchError("E001"))
    else if (!newDisplayname && !userToken) return res.status(400).send("no displayname and no userToken ")//searchError("E003"))
    else if (!newDisplayname && !userID) return res.status(400).send("no displayname and userID provided.")//searchError("E002"))
    else if (!userID && !userToken) return res.status(400).send("no userid and userToken")//searchError("E003"))
    else if (!newDisplayname) return res.status(400).send("no displayname provided.")//searchError("E002"))
    else if (!userID) return res.status(400).send("no userid")//searchError("E003"))
    else if (!userToken) return res.status(400).send("no userToken provided.")//searchError("E002"))

    // const checkedUser = await checkUsername(newDisplayname)
    // if (checkedUser.error) return res.status(400).send(checkedUser.error)

    const userIDCheck = await interactUserSchema.findOne({ _id: userID})
    if (!userIDCheck) return res.status(403).send(searchError("E004"))
    
    const userTokenCheck = await interactUserPrivSchema.findOne({_id: userID}) 
    if (userTokenCheck.userToken != userToken) return res.status(403).send("that user token is incorrect.")

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
        { _id: userID }, 
        { displayName: newDisplayname, lastEditDisplayname: currenttime }, 
        { new: true, upsert: true }
    )

    if (!UserData) return res.status(404).send("no user found")//searchError("D002"))
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck});
})

module.exports = router;
