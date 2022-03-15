const router = require('express').Router();
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserAccessSchema = require('../../../../schemas/interactUserAccessSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const foundUsername = await interactUserSchema.findOne({ _id: req.headers.userid});
    if (!foundUsername) return res.status(403).send(searchError("G003"));

    const foundPrivUser = await interactUserPrivSchema.findOne({_id: foundUsername._id});
    if (!foundPrivUser) return res.status(403).send(searchError("G004"));

    const foundAccessToken = await interactUserAccessSchema.findOne({ appToken: req.headers.apptoken, userID: req.headers.userid, userToken: req.headers.usertoken});

    const sendData = {
        "login" : true,
        "publicData" : foundUsername,
        "accessToken" : foundAccessToken._id,
        "userToken" : foundAccessToken.userToken,
        "userID" : foundAccessToken.userID,
    };

    return res.status(200).send(sendData);
});

module.exports = router;