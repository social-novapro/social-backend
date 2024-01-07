const { getPrivacySettings } = require('../../../../../utils/privacy');
const router = require('express').Router();

router.get('/', async (req, res) => {
    const privacyFound = await getPrivacySettings({ userID: req.headers.userid });

    if (!privacyFound || privacyFound.error) return res.status(400).send(privacyFound);
    return res.status(200).send(privacyFound);
});


module.exports = router;
