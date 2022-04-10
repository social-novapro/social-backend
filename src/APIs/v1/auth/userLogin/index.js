const router = require('express').Router();
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkDevTokens } = require('../../../../utils/checkDevTokens');
const { createAccessToken } = require('../../../../utils/user/createAccessToken');
const SHA1 = require("crypto-js/sha1");

router.get('/', async (req, res) => {
    const { devtoken, apptoken, username, password } = req.headers;

    const tokenData = await checkDevTokens(devtoken, apptoken);
    if (tokenData.authorized === false) return res.status(401).send(tokenData);

    if (!username) return res.status(403).send(searchError("G001"));
    if (!password) return res.status(403).send(searchError("G002"));

    const foundUsername = await interactUserSchema.findOne({username});
    if (!foundUsername) return res.status(403).send(searchError("G003"));
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUsername._id});
    if (!foundPrivUser) return res.status(403).send(searchError("G004"));

    var passwordCorrect = false;
    if (foundPrivUser.salted) {
        const [salt, key] = foundPrivUser.password.split(":");
        const saltedPassword = SHA1(password).toString();

        if (key != saltedPassword) return res.status(403).send(searchError("G005"));
        passwordCorrect=true
    }
    else {
        if (foundPrivUser.password != password) return res.status(403).send(searchError("G005"));
        passwordCorrect=true
    }

    if (!passwordCorrect) return res.status(403).send(searchError("G005"));
    
    const accessTokenFound = await createAccessToken(foundPrivUser._id, foundPrivUser.userToken, apptoken);

    const sendData = {
        "login" : true,
        "publicData" : foundUsername,
        "accessToken" : accessTokenFound._id,
        "userToken" : accessTokenFound.userToken,
        "userID" : accessTokenFound.userID,
    };

    res.status(200).send(sendData);
})

module.exports = router;