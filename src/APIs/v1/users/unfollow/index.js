const router = require('express').Router();
const { unfollowUser } = require('../../../../utils/user/follows');

router.delete('/:unfollowUserID', async (req, res) => {
    const { unfollowUserID } = req.params;
    const unfollowed = await unfollowUser({ userID: req.headers.userid, unfollowUserID });
    
    if (unfollowed.error) return res.status(400).send(unfollowed);
    return res.status(200).send(unfollowed);
});

module.exports = router;
