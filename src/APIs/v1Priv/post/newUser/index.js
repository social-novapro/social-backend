const router = require('express').Router();
const { newUserIndex } = require('../../../../utils/user/createUser');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const { searchErrorV2 } = require('../../../../utils/searchError/');
const { checkUsername, checkPassword } = require('../../../../utils/checks/');
const { checkDevTokens } = require('../../../../utils/checkDevTokens');
const { createAccessToken } = require('../../../../utils/user/createAccessToken/');
const SHA1 = require("crypto-js/sha1");
const { setEmail } = require('../../../../utils/email/setEmail');

router.post('/', async (req, res) => {
    const tokenData = await checkDevTokens(req.headers.devtoken, req.headers.apptoken);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { username, displayName, password, description, pronouns, statusTitle, email } = req.body;

    if (!username && !displayName) return res.status(400).send(searchErrorV2("C002", { userID: null }));
    else if (!username) return res.status(400).send(searchErrorV2("C003", { userID: null }));
    else if (!displayName) return res.status(400).send(searchErrorV2("C004", { userID: null }));
    else if (!password) return res.status(400).send(searchErrorV2("C006", { userID: null }));

    const checkedUser = await checkUsername(username);
    if (checkedUser.error) return res.status(400).send(checkedUser.error);
    
    const checkedPassword = await checkPassword(password);
    if (checkedPassword.error) return res.status(400).send(checkedPassword.error);

    const { devtoken, apptoken }  = req.headers;
    const newUserDataForEntry = { username, displayName, password, description, pronouns, statusTitle, devToken: devtoken, appToken: apptoken };  
    const newUserID = await newUserIndex(newUserDataForEntry);

    if (newUserID.error) return res.status("400").send(newUserID.error);

    const foundUsername = await interactUserSchema.findOne({username});
    if (!foundUsername) return res.status(403).send(searchErrorV2("G003", { userID: newUserID }));
    
    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUsername._id});
    if (!foundPrivUser) return res.status(403).send(searchErrorV2("G004", { userID: newUserID }));

    var passwordCorrect = false;
    if (foundPrivUser.salted) {
        const [salt, key] = foundPrivUser.password.split(":");
        const saltedPassword = SHA1(password).toString();
        if (key != saltedPassword) return res.status(403).send(searchErrorV2("G005", { userID: newUserID }));
        passwordCorrect=true
    }
    else {
        if (foundPrivUser.password != password) return res.status(403).send(searsearchErrorV2chError("G005", { userID: newUserID }));
        passwordCorrect=true
    }

    if (!passwordCorrect) return res.status(403).send(searchErrorV2("G005", { userID: newUserID }));
    
    if (email) {
        await setEmail({ email, userID: foundUsername._id, password });
        // no error handling done
    }



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
