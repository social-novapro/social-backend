const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const alertFunctions = require('../../../../utils/alerts/');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { alertContent, alertTitle, timeToLive, postID, type } = req.body
    if (!alertContent) return res.status(400).send(searchError("M002"));

    const newAlert = await alertFunctions.createAlert({
        userID: req?.headers?.userid,
        alertContent,
        alertTitle: alertTitle ? alertTitle : null,
        timeToLive: timeToLive ? timeToLive : null,
        postID: postID ? postID : null,
        type: type ? type : null
    })

    if (!newAlert.sucess) return res.status(400).send(newAlert);
    else return res.status(200).send(newAlert);
});

module.exports = router;
