const router = require('express').Router();
const { setPrivacySetting } = require('../../../../../utils/privacy');

router.post('/', async (req, res) => {
    const updateSetting = await setPrivacySetting({ 
        userID: req.headers.userid, 
        newSettings: req.body.newSettings
    });


    if (!updateSetting || updateSetting.error) return res.status(400).send(updateSetting);
    return res.status(200).send(updateSetting);
});

module.exports = router;
