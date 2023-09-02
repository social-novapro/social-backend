const router = require('express').Router();
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { getNotifications } = require('../../../../utils/notifications/getList');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers 
    
    const foundNotifications = await getNotifications({ userID: userid })
    if (!foundNotifications || foundNotifications.error) return res.status(404).send(foundNotifications);
    
    return res.status(200).send(foundNotifications);
});

module.exports = router;
