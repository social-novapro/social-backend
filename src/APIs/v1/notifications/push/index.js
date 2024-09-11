const router = require('express').Router();

const register = require('./register');
const deregister = require('./deregister');
const { getNotificationSettings, updateNotificationSettings } = require('../../../../utils/pushNotifications/apnProvider');

router.use('/register', register);
router.use('/deregister', deregister);

router.get('/apply', async (req, res) => {
    const foundSettings = await getNotificationSettings({ userID, deviceToken });
    if (!foundSettings || foundSettings.error) return res.status(400).send(foundSettings)
    return res.status(200).send(foundSettings);
})

router.post('/deviceSettings', async (req, res) => {
    const { deviceToken } = req.body;
    const { userid: userID } = req.headers;
    const foundSettings = await getNotificationSettings({ userID, deviceToken });
    if (!foundSettings || foundSettings.error) return res.status(400).send(foundSettings)
    return res.status(200).send(foundSettings);
})

router.get('/possibleSettings', async (req, res) => {
    return res.status(200).send(possibleSettings());
})

router.put('/update', async (req, res) => {
    const { newSettings, deviceToken } = req.body;
    const { userid: userID } = req.headers;
    const foundSettings = await updateNotificationSettings({ userID, deviceToken, newSettings });
    if (!foundSettings || foundSettings.error) return res.status(400).send(foundSettings);
    return res.status(200).send(foundSettings);
})

module.exports = router;