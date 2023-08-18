const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { checktime } = require('../../../../utils/checktime');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { newdisplayname, userid } = req.headers;

    if (!newdisplayname && !userid) return res.status(400).send(searchErrorV2("C007", { userID: userid }));
    else if (!newdisplayname) return res.status(400).send(searchErrorV2("C008", { userID: userid }));
    else if (!userid) return res.status(400).send(searchErrorV2("B009", { userID: userid }));

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchErrorV2("E004", { userID: userid }));
    

    var lastEdited = 0;
    if (!userIDCheck.lastEditDisplayname) lastEdited = 0;
    else lastEdited = userIDCheck.lastEditDisplayname;

    const currenttime = checktime();
    const timediff = currenttime - lastEdited;
    const firstMinutes = Math.floor(timediff / 60000) % 60;
    const firstSeconds = Math.floor(timediff / 1000) % 60;

    const minutes = 29 - firstMinutes;
    const seconds = 59 - firstSeconds;

    var timeuntil;
    if (!minutes) timeuntil = `${seconds} seconds`;
    else timeuntil = `${minutes} minutes and ${seconds} seconds`;

    if (timediff < 1800000) return res.status(400).send({"error" : `You must wait ${timeuntil} before changing again.`});

    const UserData = await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { displayName: newdisplayname, lastEditDisplayname: currenttime }, 
        { new: true, upsert: true }
    );

    if (!UserData) return res.status(404).send(searchErrorV2("C009", { userID: userid }));
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck, "warning": "deprecated–use /put/userEdit instead."});
})

module.exports = router;
