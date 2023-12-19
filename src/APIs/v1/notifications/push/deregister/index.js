const router = require('express').Router();
const { registerDevice, sendNotification, deregisterDevice } = require('../../../../../utils/pushNotifications/apnProvider');

router.delete('/', async (req, res) => {
    const { deviceToken, userID } = req.body;
    const completion = await deregisterDevice({userID, deviceToken});
    if (!completion || completion.error) return completion

    return res.status(200).send({msg: 'Device token deregistered successfully'});
});

module.exports = router;
