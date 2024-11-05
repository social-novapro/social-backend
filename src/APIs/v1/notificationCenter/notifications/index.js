const router = require('express').Router();
const { userNotifications } = require('../../../../utils/notificationCenter/base');

router.get('/', async (req, res) => {
    const foundNotifs = await userNotifications({ userID: req.headers.userid });
    return res.status(200).send(foundNotifs);
});

router.get('/:userID', async (req, res) => {
    return false; // this is a test route
    const foundNotifs = await userNotifications({ userID: req.params.userID });
    return res.status(200).send(foundNotifs);
});

module.exports = router;