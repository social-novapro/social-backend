const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { checktime } = require('../../../../utils/checktime');
const { checkUsername } = require('../../../../utils/checks');

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
	  "newStatus"
      // more?
    ]

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchError("E004"));

    var foundHeader = false
    for(const editableAttribute of editableAttributes) {
		if (headers[editableAttribute] || headers[editableAttribute.toLowerCase()]) foundHeader = true;
        // if(!headers.contains(editableAttribute))
		// return res.status(400).send(searchError("E010"));
    }

	if (!foundHeader) return res.status(400).send({"error" : "not found"});// searchError("E010")

    var lastEdited = 0;
    if (!userIDCheck.lastEdit) lastEdited = 0;
    else lastEdited = userIDCheck.lastEdit;

    const currenttime = checktime();
    const timediff = currenttime - lastEdited;
    const firstMinutes = Math.floor(timediff / 60000) % 60;
    const firstSeconds = Math.floor(timediff / 1000) % 60;

    const minutes = 29 - firstMinutes;
    const seconds = 59 - firstSeconds;

    var timeuntil;
    if (!minutes) timeuntil = `${seconds} seconds`;
    else timeuntil = `${minutes} minutes and ${seconds} seconds`;

	var acceptedChange = {
		accepted: false,
		reason: {},
		types: []
	}

	if (headers.newusername) {
		const checkedUser = await checkUsername(headers.newusername);
		if (checkedUser.error) return res.status(400).send(checkedUser.error);
	}
	else {
		acceptedChange = true;
	};

	if (!acceptedChange) res.status(400).send({error: "Not accepted change."})

    // if (timediff < 1800000) return res.status(400).send({"error" : `You must wait ${timeuntil} before changing again.`});//searchError("E004"))

    await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { 
          displayName: headers.newdisplayName || userIDCheck.displayName,
          username: headers.newusername || userIDCheck.username, 
          pronouns: headers.newpronouns || userIDCheck.pronouns, 
          description: headers.newdescription || userIDCheck.description,
		  statusTitle: headers.newstatus || userIDCheck.statusTitle,
          lastEdit: currenttime,
        }, 
        { upsert: true }
    );

	const UserData = await interactUserSchema.findOne({ _id: userid });
    if (!UserData) return res.status(404).send(searchError("E004"));//searchError("D002"))
    else return res.status(200).send({"new" : userIDCheck, "before" : UserData});
})

module.exports = router;
