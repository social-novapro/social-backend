const router = require('express').Router();
const { registerDevice, sendNotification } = require('../../../../../utils/pushNotifications/apnProvider');

router.post('/', async (req, res) => {
    const { deviceToken, deviceType, userID } = req.body;
    await registerDevice({userID, deviceToken, deviceType});
    return res.status(200).send({msg: 'Device token registered successfully'});
});

module.exports = router;
