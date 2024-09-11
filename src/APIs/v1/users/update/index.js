const router = require('express').Router();
const { userUpdate, getCurrentUserUpdate } = require('../../../../utils/user/update');

router.get('/', async (req, res) => {
    const currentUser = await getCurrentUserUpdate({
        userID: req.headers.userid
    });

    if (currentUser.error) return res.status(400).send(currentUser);
    return res.status(200).send(currentUser);
});

router.post('/', async (req, res) => {
    const updated = await userUpdate({
        userID: req.headers.userid,
        body: req.body
    });

    if (updated.error) return res.status(400).send(updated);
    return res.status(200).send(updated);
});

module.exports = router;
