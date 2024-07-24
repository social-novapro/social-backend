const router = require('express').Router();
const { followUser } = require('../../../../utils/user/follows');

router.post('/:userID', async (req, res) => {
    console.log("h")
    const { userID } = req.params;
    const followed = await followUser({ userID: req.headers.userid, followedUserID: userID });
    
    if (followed.error) return res.status(400).send(followed);
    return res.status(200).send(followed);
});


module.exports = router;
