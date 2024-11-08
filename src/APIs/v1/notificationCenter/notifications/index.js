const router = require('express').Router();
const { getUserNotifications } = require('../../../../utils/notificationCenter/notif_app');

router.get('/', async (req, res) => {
    const foundNotifs = await getUserNotifications({ userID: req.headers.userid });
    return res.status(200).send(foundNotifs);
});

router.get('/:indexid', async (req, res) => {
    const foundNotifs = await getUserNotifications({ userID: req.headers.userid, indexID: req.params.indexid });
    return res.status(200).send(foundNotifs);
});

module.exports = router;