const router = require('express').Router();
const { getPossiblePreferences, getPreference, setPreference } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const { userid } = req.headers.userid;

    const foundPref = await getPreference({ userID: userid});
    return res.status(200).send(foundPref);
});

router.post('/', async (req, res) => {
    const { userid } = req.headers.userid;
    const { setPref } = req.body;

    const newPrefSettings = await setPreference({ userID: userid, pref: setPref });

    if (newPrefSettings.error) return res.status(400).send(newPrefSettings);
    return res.status(200).send(newPrefSettings)
});

module.exports = router;
