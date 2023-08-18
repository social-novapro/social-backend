const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { checktime } = require('../../../../utils/checktime');
const { checkUsername } = require('../../../../utils/checks');
const { checkSafeURL } = require('../../../../utils/checkSafeURL');

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
        "newStatus",
        "isBrandAccount",
        "newProfileImage",
        "userAge"
        // more?
    ]

    const userIDCheck = await interactUserSchema.findOne({ _id: userid});
    if (!userIDCheck) return res.status(403).send(searchErrorV2("E004", { userID: userid }));

    var foundHeader = false
    for(const editableAttribute of editableAttributes) {
        if (headers[editableAttribute] || headers[editableAttribute.toLowerCase()]) foundHeader = true;
        // if(!headers.contains(editableAttribute))
        // return res.status(400).send(searchErrorV2("E010"));
    }

    if (!foundHeader) return res.status(400).send(searchErrorV2("C011", { userID: userid }));// searchErrorV2("E010", {})

    var lastEdited = 0;
    if (!userIDCheck.lastEdit) lastEdited = 0;
    else lastEdited = userIDCheck.lastEdit;

    // const currenttime = checktime();
    const currenttime = 0;
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
    var forcenonaccept = false;

    if (headers.newusername) {
        const checkedUser = await checkUsername(headers.newusername);
        if (checkedUser.error) return res.status(400).send(checkedUser.error);
    } 
    
    if (headers.newprofileimage) {
        console.log(headers)
        if (headers.newprofileimage.startsWith('dataurl://')) {
            console.log('dataurl');
        } else {
            const checkedProfile = await checkSafeURL(headers.newprofileimage);
            if (checkedProfile.safe==true) acceptedChange=true;
            else forcenonaccept=true;
        }
    } 
    if (headers.userage) {
        // if (headers.us)
        acceptedChange=true;
    }
    if (headers.isbrandaccount) {
        if (headers.isbrandaccount == "true" || headers.isbrandaccount == "false") {
            acceptedChange=true;
        } else {
            forcenonaccept=true;
        }
    }

    if (headers.newdisplayname || headers.newdescription || headers.newpronouns || headers.newstatus || headers.isbrandaccount) {
        acceptedChange=true;
    }

    
    // if (headers.userage)  

    if (acceptedChange!=true) res.status(400).send(searchErrorV2("D011", { userID: userid }));

    // if (timediff < 1800000) return res.status(400).send({"error" : `You must wait ${timeuntil} before changing again.`});//searchErrorV2("E004", {}))

    await interactUserSchema.findOneAndUpdate(
        { _id: userid }, 
        { 
            displayName: headers.newdisplayName || userIDCheck.displayName,
            username: headers.newusername || userIDCheck.username, 
            pronouns: headers.newpronouns || userIDCheck.pronouns, 
            description: headers.newdescription || userIDCheck.description,
            statusTitle: headers.newstatus || userIDCheck.statusTitle,
            profileURL: headers.newprofileimage || userIDCheck.profileURL,
            userAge: headers.userage || userIDCheck.userAge,
            lastEdit: currenttime,
        }, 
        { upsert: true }
    );

    const UserData = await interactUserSchema.findOne({ _id: userid });
    if (!UserData) return res.status(404).send(searchErrorV2("E004", { userID: userid }));
    else return res.status(200).send({"new" : userIDCheck, "before" : UserData});
})

module.exports = router;
