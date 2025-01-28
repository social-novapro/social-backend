const router = require('express').Router();
const { getNotifications } = require('../../../../utils/notifications/getList');

router.get('/', async (req, res) => {
    const { userid } = req.headers 
    
    const foundNotifications = await getNotifications({ userID: userid })
    if (!foundNotifications || foundNotifications.error) return res.status(404).send(foundNotifications);
    
    return res.status(200).send(foundNotifications);
});

module.exports = router;
