const router = require('express').Router();
const { getUserNotifications } = require('../../../../utils/notificationCenter/notif_app');
const { dismissNotification, dismissAllNotifications } = require('../../../../utils/notifications/dismissNotification');

router.get('/', async (req, res) => {
    const foundNotifs = await getUserNotifications({ userID: req.headers.userid });
    if (foundNotifs.error) return res.status(400).send(foundNotifs);
    return res.status(200).send(foundNotifs);
});

router.get('/:indexid', async (req, res) => {
    const foundNotifs = await getUserNotifications({ userID: req.headers.userid, indexID: req.params.indexid });
    if (foundNotifs.error) return res.status(400).send(foundNotifs);
    return res.status(200).send(foundNotifs);
});

router.delete('/dismissAll', async (req, res) => {
    const dismissed = await dismissAllNotifications({ userID: req.headers.userid });
    if (dismissed.error) return res.status(400).send(dismissed);
    return res.status(200).send(dismissed);
});

router.delete('/dismiss/:notificationID', async (req, res) => {
    const dismissed = await dismissNotification({ userID: req.headers.userid, notificationID: req.params.notificationID });
    if (dismissed.error) return res.status(400).send(dismissed);
    return res.status(200).send(dismissed);
});

module.exports = router;