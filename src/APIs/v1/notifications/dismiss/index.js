const router = require('express').Router();
const { dismissNotification } = require('../../../../utils/notifications/dismissNotification');

router.delete('/:notificationID', async (req, res) => {
    const { notificationID } = req.params;
    const { userid } = req.headers;
    
    const dismissed = await dismissNotification({userID: userid, notificationID});

    if (dismissed.success == false) return res.status(300).send(dismissed);
    else return res.status(200).send(dismissed)
})

module.exports = router;
