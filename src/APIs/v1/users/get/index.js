const router = require('express').Router();
const { getUserPosts } = require('../../../../utils/post/user');
const { getAllUserData, getBasicUserData } = require('../../../../utils/user/getUser');

router.get('/basic/:searchTerm', async (req, res) => {
    const { searchTerm } = req.params;
    const send = await getBasicUserData({ userID: req.headers.userid, searchTerm });
    if (send.error) return res.status(400).send(send);
    return res.status(200).send(send);
});

router.get('/userPosts/u/:userID', async (req, res) => {
    const { userID } = req.params;
    const send = await getUserPosts({ userID, requesterID: req.headers.userid, postIndexID });
    if (send.error) return res.status(400).send(send);
    return res.status(200).send(send);
});

router.get('/userPosts/:postIndexID', async (req, res) => {
    const { postIndexID } = req.params;
    const send = await getUserPosts({ userID: null, requesterID: req.headers.userid, indexID: postIndexID });
    if (send.error) return res.status(400).send(send);
    return res.status(200).send(send);
});

router.get('/:searchTerm', async (req, res) => {
    const { searchTerm } = req.params;
    const send = await getAllUserData({ userID: req.headers.userid, searchTerm });
    if (send.error) return res.status(400).send(send);
    return res.status(200).send(send);
});

module.exports = router;
