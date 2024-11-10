const router = require('express').Router();
const { getSubscriptions, unsubFromUser, subToUser, unsubFromAll, isSubbed } = require('../../../../utils/notifications/subscriptions');
const { searchErrorV2 } = require('../../../../utils/searchError');

// Get all subscriptions for a user
router.get('/', async (req, res) => {
    const foundSubs = await getSubscriptions({ userID: req.headers.userid });
    if (foundSubs.error) return res.status(400).send(foundSubs);
    return res.status(200).send(foundSubs);
});

// Fallback
router.get('/subData', async (req, res) => {
    return res.status(400).send(searchErrorV2("L039", { userID: req.headers.userid }));
});
// Get subscription data for a user
router.get('/subData/:subUserID', async (req, res) => {
    const { subUserID } = req.params;
    const foundSubs = await isSubbed({ userID: req.headers.userid, subUserID });
    if (foundSubs.error) return res.status(400).send(foundSubs);
    return res.status(200).send(foundSubs);
});

// Fallback
router.post('/sub/', async (req, res) => {
    return res.status(400).send(searchErrorV2("L037", { userID: req.headers.userid }));
});
// Subscribe to a user
router.post('/sub/:subUserID', async (req, res) => {
    const { subUserID } = req.params;
    const foundNotifs = await subToUser({ userID: req.headers.userid, subUserID });
    if (foundNotifs.error) return res.status(400).send(foundNotifs);
    return res.status(200).send(foundNotifs);
});

// Fallback
router.delete('/unsub/', async (req, res) => {
    return res.status(400).send(searchErrorV2("L038", { userID: req.headers.userid }));
});
// Unsubscribe from a user
router.delete('/unsub/:subUserID', async (req, res) => {
    const { subUserID } = req.params;
    const unsubbed = await unsubFromUser({ userID: req.headers.userid, subUserID });
    if (unsubbed.error) return res.status(400).send(unsubbed);
    return res.status(200).send(unsubbed);
});

// Unsub from all users
router.delete('/unsubAll', async (req, res) => {
    const unsubbed = await unsubFromAll({ userID: req.headers.userid });
    if (unsubbed.error) return res.status(400).send(unsubbed);
    return res.status(200).send(unsubbed);
});

module.exports = router;