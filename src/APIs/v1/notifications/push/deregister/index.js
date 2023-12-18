const router = require('express').Router();
const { registerDevice, sendNotification, deregisterDevice } = require('../../../../../utils/pushNotifications/apnProvider');

router.post('/', async (req, res) => {
    const { deviceToken, userID, deviceType } = req.body;
    await deregisterDevice({userID, deviceToken, deviceType});
    return res.status(200).send({msg: 'Device token deregistered successfully'});
});

module.exports = router;
