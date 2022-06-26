const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkUsername } = require('../../../../utils/checks');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { newusername, userid } = req.headers;
    
    // const checkTokens = await checkRequestTokens(req.headers)
    // if (checkTokens) if (checkTokens.authorized==false) return res.status(400).send(checkTokens)


    if (!newusername && !userid) return res.status(400).send("no username and userID provided.");//searchError("E002"))
    else if (!newusername) return res.status(400).send("no username provided.");//searchError("E002"))
    else if (!userid) return res.status(400).send("no userid");//searchError("E003"))

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchError("E004"));
    
    const checkedUser = await checkUsername(newusername);
    if (checkedUser.error) return res.status(400).send(checkedUser.error);

    var lastEdited = 0;
    if (!userIDCheck.lastEditUsername) lastEdited = 0;
    else lastEdited = userIDCheck.lastEditUsername;

    const currenttime = checktime();
    const timediff = currenttime - lastEdited;
    const firstMinutes = Math.floor(timediff / 60000) % 60;
    const firstSeconds = Math.floor(timediff / 1000) % 60;

    const minutes = 29 - firstMinutes;
    const seconds = 60 - firstSeconds;

    var timeuntil;
    if (!minutes) timeuntil = `${seconds} seconds`;
    else timeuntil = `${minutes} minutes and ${seconds} seconds`;

    if (timediff < 1800000) return res.status(400).send(`You must wait ${timeuntil} before changing again.`);//searchError("E004"))

    await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { username: newusername, lastEditUsername: currenttime }
    );

    const UserData = await interactUserSchema.findOne({_id: userid});
    if (!UserData) return res.status(404).send("no user found");//searchError("D002"))
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck, "warning": "deprecated–use /put/userEdit instead."});
})

module.exports = router;
