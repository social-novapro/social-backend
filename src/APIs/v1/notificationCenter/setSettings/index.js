const router = require('express').Router();
const { getNotifData } = require('../../../../utils/notificationCenter/updatePreferences');

router.post('/', async (req, res) => {
    const foundNotif = await getNotifData({ userID: req.headers.userid });
    return res.status(200).send(foundNotif);
})

module.exports = router;
