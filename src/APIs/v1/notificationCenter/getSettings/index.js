const router = require('express').Router();
const { getNotifData, getNotifDataType } = require('../../../../utils/notificationCenter/updatePreferences');

router.get('/', async (req, res) => {
    const foundNotif = await getNotifData({ userID: req.headers.userid });
    return res.status(200).send(foundNotif);
})

router.get('/:typeID', async (req, res) => {
    const foundNotif = await getNotifDataType({ userID: req.headers.userid, typeID: req.params.typeID });
    return res.status(200).send(foundNotif);
})

module.exports = router;
