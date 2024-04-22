const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkUsername } = require('../../../../utils/checks');
const { checktime } = require('../../../../utils/checktime');

router.put('/', async (req, res) => {
    const { newusername, userid } = req.headers;
    if (!newusername && !userid) return res.status(400).send(searchErrorV2("C010", { userID: userid }));
    else if (!newusername) return res.status(400).send(searchErrorV2("G001", { userID: userid }));
    else if (!userid) return res.status(400).send(searchErrorV2("B009", { userID: userid }));

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchErrorV2("E004", { userID: userid }));
    
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

    if (timediff < 1800000) return res.status(400).send({"error" : `You must wait ${timeuntil} before changing again.`});

    await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { 
            username: newusername, 
            usernameLc: newusername.toLowerCase(), 
            lastEditUsername: currenttime
        }
    );

    const UserData = await interactUserSchema.findOne({_id: userid});
    if (!UserData) return res.status(404).send(searchErrorV2("C009", { userID: userid }));
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck, "warning": "deprecated–use /put/userEdit instead."});
})

module.exports = router;
