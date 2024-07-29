const router = require('express').Router();
const { followUser } = require('../../../../utils/user/follows');

router.post('/:followUserID', async (req, res) => {
    const { followUserID } = req.params;
    const followed = await followUser({ userID: req.headers.userid, followedUserID: followUserID });
    
    if (followed.error) return res.status(400).send(followed);
    return res.status(200).send(followed);
});

module.exports = router;
