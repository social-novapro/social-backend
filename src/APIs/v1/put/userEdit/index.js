const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { checktime } = require('../../../../utils/checktime');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const headers = req.headers
    const userid = headers.userid
    
    const editableAttributes = [
      "newUsername",
      "newDisplayname",
      "newDescription",
      "newPronouns",
      // more?
    ]

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchError("E004"));
    
    for(editableAttribute of editableAttributes){
        if(!headers.contains(editableAttribute)
           return res.status(400).send(searchError("E010"));
    }
  
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

    if (timediff < 1800000) return res.status(400).send(`You must wait ${timeuntil} before changing again.`);//searchError("E004"))
    const previousUserData = await interactUserSchema.findOne(
      { _id: userid }
    ).exec();
    const UserData = await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { 
          displayName: headers.newDisplayName || previousUserData.displayName,
          username: headers.newUsername || previousUserData.username, 
          pronouns: headers.newPronouns || previousUserData.pronouns, 
          description: headers.newDescription || previousUserData.description,
          lastEdit: currenttime 
        }, 
        { new: true, upsert: true }
    );

    if (!UserData) return res.status(404).send("no user found");//searchError("D002"))
    else return res.status(200).send({"new" : UserData, "before" : userIDCheck});
})

module.exports = router;
