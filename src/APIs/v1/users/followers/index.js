const router = require('express').Router();
const { getFollowers } = require('../../../../utils/user/follows');

router.get('/:userID/:page', async (req, res) => {
    const { userID } = req.params;
    // TODO: pages
    const followers = await getFollowers({ userID, ownUserID: req.headers.userid });
    
    if (followers.error) return res.status(400).send(followers);
    return res.status(200).send(followers);
});

router.get('/:userID', async (req, res) => {
    const { userID } = req.params;
    const followers = await getFollowers({ userID, ownUserID: req.headers.userid });
    if (followers.error) return res.status(400).send(followers);
    return res.status(200).send(followers);
});

router.get('/', async (req, res) => {
    const { userid } = req.headers
    const followers = await getFollowers({ userID: userid, ownUserID: userid });
    if (followers.error) return res.status(400).send(followers);
    return res.status(200).send(followers);

});
module.exports = router;
