const router = require('express').Router();
const { getPreference, updateUserPreference } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const { userid } = req.headers;

    const foundPref = await getPreference({ userID: userid });
    return res.status(200).send(foundPref);
});

router.post('/', async (req, res) => {
    const { userid } = req.headers;
    const { setPref } = req.body;

    const newPrefSettings = await updateUserPreference({ userID: userid, pref: setPref });
    if (newPrefSettings.error) return res.status(400).send(newPrefSettings);
    return res.status(200).send(newPrefSettings)
});

module.exports = router;
