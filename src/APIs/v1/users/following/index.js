const router = require('express').Router();
const { getFollowing } = require('../../../../utils/user/follows');

router.get('/:userID/:indexID', async (req, res) => {
    const { userID, indexID } = req.params;
    const following = await getFollowing({ userID, ownUserID: req.headers.userid, indexID });
    
    if (following.error) return res.status(400).send(following);
    return res.status(200).send(following);
});

router.get('/:userID', async (req, res) => {
    const { userID } = req.params;
    const following = await getFollowing({ userID, ownUserID: req.headers.userid });
    if (following.error) return res.status(400).send(following);
    return res.status(200).send(following);
});

router.get('/', async (req, res) => {
    const { userid } = req.headers
    const following = await getFollowing({ userID: userid, ownUserID: userid });
    if (following.error) return res.status(400).send(following);
    return res.status(200).send(following);
});

module.exports = router;
