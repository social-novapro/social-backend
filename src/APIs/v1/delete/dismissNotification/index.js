const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { dismissNotification } = require('../../../../utils/notifications/dismissNotification');

router.delete('/:notificationID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { notificationID } = req.params;
    const { userid } = req.headers;
    
    if (!notificationID) return res.status(400).send(searchError("D006")); //searchError("E003"))
    const dismissed = await dismissNotification(userid, notificationID);

    if (dismissed.success == false) return res.status(300).send(dismissed);
    else return res.status(200).send(dismissed)
})

module.exports = router;
