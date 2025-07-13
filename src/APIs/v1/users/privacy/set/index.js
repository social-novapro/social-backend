const router = require('express').Router();
const { setPrivacySettings } = require('../../../../../utils/privacy');

router.post('/', async (req, res) => {
    const updateSettings = await setPrivacySettings({ 
        userID: req.headers.userid, 
        newSettings: req.body.newSettings
    });

    if (!updateSettings || updateSettings.error) return res.status(400).send(updateSettings);
    return res.status(200).send(updateSettings);
});


module.exports = router;
