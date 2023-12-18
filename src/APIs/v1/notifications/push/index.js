const router = require('express').Router();

const register = require('./register');
const deregister = require('./deregister');
const { sendPushAppleNotification } = require('../../../../utils/pushNotifications/apnProvider');

router.use('/register', register);
router.use('/deregister', deregister);

router.get('/', async (req, res) => {
    return res.status(502).send({msg: 'Push notifications API'});
    await sendPushAppleNotification({userID: "92316f43-b782-428d-9fe0-df960f5dd267", notification: {title: "title test", subtitle: "subtitle test", body: "body test"}});
    return res.send("push notifications");
})

module.exports = router;