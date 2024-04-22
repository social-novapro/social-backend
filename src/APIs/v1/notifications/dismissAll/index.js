const router = require('express').Router();
const { dismissAllNotifications } = require('../../../../utils/notifications/dismissNotification');

router.delete('/', async (req, res) => {
    const { userid } = req.headers;
    
    const dismissed = await dismissAllNotifications({ userID: userid });

    if (dismissed.success == false) return res.status(300).send(dismissed);
    else return res.status(200).send(dismissed)
})

module.exports = router;
