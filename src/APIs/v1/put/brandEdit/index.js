const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactBrandAccountSchema = require('../../../../schemas/user/interactBrandAccountSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { checktime } = require('../../../../utils/checktime');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const headers = req.headers
    const userid = headers.userid
    
    const { addingUserID, accountLevel } = headers
    const accessTypesArray = [
        "changeOwner",
        "newAdmin",
        "newManager",
        "newPoster",
        "1", "2","3", "4"
        // more?
    ]

    const accessTypeObjs = {
        "changeOwner" : 1,
        "newAdmin": 2,
        "newManager" : 3,
        "newPoster": 4,
        "1" : 1,
        "2" : 2,
        "3" : 3,
        "4" : 4
    }
    const userIDCheck = await interactUserSchema.findOne({ _id: userid });
    if (!userIDCheck) return res.status(403).send(searchErrorV2("E004", { userID: userid }));
    if (!userIDCheck.brandAccount) return res.status(403).send({"error" : "is not brand account"});

    const foundAddingUserID = await interactUserSchema.findOne({ _id: addingUserID});
    if (!foundAddingUserID) return res.status(403).send({"error" : "the userid provided for the change was not found."});

    var foundHeader = false
    var usingAccess = 0
    for (const accessType in accessTypeObjs) {
        if (accessType==accountLevel) {
            foundHeader == true
            usingAccess = accessTypeObjs[accessType]
        }
    }

    // for(const accessType of accessTypesArray) {
    //     if (accessType==accountLevel) {
    //         if (accessType == "1") usingAccess = 1
    //         if (accessType == "2") usingAccess = 2
    //         if (accessType == "3") usingAccess = 3
    //         if (accessType == "4") usingAccess = 4
    //         if (accessType == "changeOwner") usingAccess = 1
    //         if (accessType == "newAdmin") usingAccess = 2
    //         if (accessType == "newManager") usingAccess = 3
    //         if (accessType == "4") usingAccess = 4
    //         foundHeader == true
    //     }
    // }

    if (!foundHeader) return res.status(400).send({"error" : "access type not accepted"})


    const currenttime = checktime();
    // var acceptedChange = {
    //     accepted: false,
    //     reason: {},
    //     types: []
    // }
    // if (timediff < 1800000) return res.status(400).send({"error" : `You must wait ${timeuntil} before changing again.`})
    // const beforeSchema = await interactBrandAccountSchema({ _id: userid, _id: { $in : users }})
    const beforeSchema = await interactBrandAccountSchema.findOne({_id: userid})
    const foundUser = beforeSchema.users.find(({ _id }) => _id==addingUserID);

    if (foundUser) return res.status(403).send({"error" : "user already accessed"})
    /*
        make change:
            check if user is already there
    */
    await interactBrandAccountSchema.findOneAndUpdate(
        { _id: userid }, 
        { $push : { "users" : {
            _id: addingUserID,
            timestamp: currenttime,
            accessLevel: accountLevel
        }}}, 
        { upsert: true }
    );

    const UserData = await interactBrandAccountSchema.findOne({ _id: userid });
    if (!UserData) return res.status(404).send(searchErrorV2("E004", { userID: userid }))
    else return res.status(200).send({"new" : userIDCheck, "before" : UserData});
});

module.exports = router;
