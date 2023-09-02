const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const alertFunctions = require('../../../../utils/alerts');

router.put('/:alertID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const { alertID } = req.params;
    const userID = req.headers.userid

    const dimissAlertReturn = await alertFunctions.dismissAlert({ alertID, userID})

    if (!dimissAlertReturn.success) return res.status(400).send(dimissAlertReturn)
    else return res.status(200).send(dimissAlertReturn)
});

module.exports = router;
