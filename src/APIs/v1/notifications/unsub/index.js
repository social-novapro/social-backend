const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { unsubFromUser } = require('../../../../utils/notifications/subscriptions');

router.delete('/:unsubUserID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { unsubUserID } = req.params;
    const { userid } = req.headers;

    const userID = userid
    if (!unsubUserID) return res.status(400).send({"error" : "no sub request"});

    const pulled = await unsubFromUser({ userID, subUserID: unsubUserID });
    
    if (pulled.error) return res.status(400).send(pulled);
    else return res.status(200).send(pulled);
});

module.exports = router;
