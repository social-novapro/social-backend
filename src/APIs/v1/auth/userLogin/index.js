const router = require('express').Router();
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkDevTokens } = require('../../../../utils/checkDevTokens');
const { createAccessToken } = require('../../../../utils/user/createAccessToken');
const SHA1 = require("crypto-js/sha1");
const { useID } = require("@dothq/id");
const interactEmailVerificationSchema = require('../../../../schemas/emails/interactEmailVerificationSchema');
const {checkPassword, checkTypeLogin} = require('../../../../utils/userAuth/');

router.get('/', async (req, res) => {
    const { devtoken, apptoken, username, password } = req.headers;

    if (!username) return res.status(403).send(searchErrorV2("G001"), { userID: username });
    if (!password) return res.status(403).send(searchErrorV2("G002"), { userID: username });

    const tokenData = await checkDevTokens(devtoken, apptoken);
    if (tokenData.authorized === false) return res.status(401).send(tokenData);


    const checkLoginUsername = await checkTypeLogin({ username });
    if (checkLoginUsername.error) return res.status(403).send(checkLoginUsername);

    const { 
        foundUserID,
        usernameFound,
        foundUser
    } = checkLoginUsername;

  
    const foundPassword = await checkPassword({ userID: foundUserID, password });
    if (foundPassword.error) return res.status(403).send(foundPassword);
    if (foundPassword.correctPassword != true) return res.status(403).send(searchErrorV2("G005"), { userID: foundUserID });
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUserID });
    if (!foundPrivUser) return res.status(403).send(searchErrorV2("G004"), { userID: foundUserID });
    
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