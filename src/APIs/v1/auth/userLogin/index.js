const router = require('express').Router();
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkDevTokens } = require('../../../../utils/checkDevTokens');
const { createAccessToken } = require('../../../../utils/user/createAccessToken');
const SHA1 = require("crypto-js/sha1");
const { useID } = require("@dothq/id");
const interactEmailVerificationSchema = require('../../../../schemas/emails/interactEmailVerificationSchema');
const {checkPassword} = require('../../../../utils/userAuth/');

router.get('/', async (req, res) => {
    const { devtoken, apptoken, username, password } = req.headers;

    if (!username) return res.status(403).send(searchError("G001"));
    if (!password) return res.status(403).send(searchError("G002"));

    // if email regex
    const emailRegex = /\S+@\S+\.\S+/;
    const emailUsed = emailRegex.test(username) ? true : false;

    const tokenData = await checkDevTokens(devtoken, apptoken);
    if (tokenData.authorized === false) return res.status(401).send(tokenData);

    var foundUserID = null;
    var usernameFound = null;
    var foundUser = null;
    // username login
    if (!emailUsed) {
        const foundUsername = await interactUserSchema.findOne({ username });
        if (!foundUsername) return res.status(403).send(searchError("G003"));

        foundUserID = foundUsername._id;
        usernameFound = foundUsername.username;
        foundUser = foundUsername;
    }

    // email login
    if (emailUsed) {
        const email = username;
        const foundEmailUser = await interactEmailVerificationSchema.findOne({ email });
        if (!foundEmailUser) return res.status(403).send(searchError("G003"));
        if (foundEmailUser.verified != true) return res.status(403).send(searchError("G006"));

        const foundUsername = await interactUserSchema.findOne({ _id: foundEmailUser.userID });
        if (!foundUsername) return res.status(403).send(searchError("G003"));

        foundUserID = foundUsername._id;
        usernameFound = foundUsername.username;
        foundUser = foundUsername;
    }
  
    const foundPassword = await checkPassword({ userID: foundUserID, password });
    if (foundPassword.error) return res.status(403).send(foundPassword);
    if (foundPassword.correctPassword != true) return res.status(403).send(searchError("G005"));
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUserID });
    if (!foundPrivUser) return res.status(403).send(searchError("G004"));
    
    const accessTokenFound = await createAccessToken(foundUserID, foundPrivUser.userToken, apptoken);
    const sendData = {
        "login" : true,
        "publicData" : foundUser,
        "accessToken" : accessTokenFound._id,
        "userToken" : accessTokenFound.userToken,
        "userID" : accessTokenFound.userID,
    };

    res.status(200).send(sendData);
})

module.exports = router;