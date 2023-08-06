const router = require('express').Router();
const { newUserIndex } = require('../../../../utils/user/createUser');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../../../utils/searchError/');
const { checkUsername, checkPassword } = require('../../../../utils/checks/');
const { checkDevTokens } = require('../../../../utils/checkDevTokens');
const { createAccessToken } = require('../../../../utils/user/createAccessToken/');
const SHA1 = require("crypto-js/sha1");
const { setEmail } = require('../../../../utils/email/setEmail');
const { setPassword } = require('../../../../utils/userAuth');

router.post('/', async (req, res) => {
    const tokenData = await checkDevTokens(req.headers.devtoken, req.headers.apptoken);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { username, displayName, password, description, pronouns, statusTitle, email } = req.body;

    if (!username && !displayName) return res.status(400).send(searchError("C002"));
    else if (!username) return res.status(400).send(searchError("C003"));
    else if (!displayName) return res.status(400).send(searchError("C004"));
    else if (!password) return res.status(400).send(searchError("C006"));

    const checkedUser = await checkUsername(username);
    if (checkedUser.error) return res.status(400).send(checkedUser.error);
    
    const checkedPassword = await checkPassword(password);
    if (checkedPassword.error) return res.status(400).send(checkedPassword.error);

    const { devtoken, apptoken }  = req.headers;
    const newUserDataForEntry = { username, displayName, password, description, pronouns, statusTitle, devToken: devtoken, appToken: apptoken };  
    const newUserID = await newUserIndex(newUserDataForEntry);

    if (newUserID.error) return res.status("400").send(newUserID.error);

    const foundUsername = await interactUserSchema.findOne({username});
    if (!foundUsername) return res.status(403).send(searchError("G003"));
    
    const privUserPass = await setPassword({ userID: foundUsername._id, password })
    if (privUserPass.error) return res.status(400).send(privUserPass);

    if (email) {
        await setEmail({ email, userID: foundUsername._id, password });
        // no error handling done
    }
 
    const accessTokenFound = await createAccessToken(privUserPass._id, privUserPass.userToken, apptoken);

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
