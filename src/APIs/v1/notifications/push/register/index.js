const router = require('express').Router();
const { registerDevice, sendNotification } = require('../../../../../utils/pushNotifications/apnProvider');

router.post('/', async (req, res) => {
    const { deviceToken, deviceType } = req.body;
    const { userid: userID } = req.headers;

    const completion = await registerDevice({userID, deviceToken, deviceType});
    if (!completion || completion.error) return completion
    return res.status(200).send({msg: 'Device token registered successfully'});
});

module.exports = router;
