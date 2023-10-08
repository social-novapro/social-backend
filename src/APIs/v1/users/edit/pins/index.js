const router = require('express').Router();
const { addPinnedPost, removePinnedPost, removeAllPinnedPosts } = require('../../../../../utils/user/edit');

router.delete("/removeAll", async (req, res) => {
    console.log("hiuj")
    const removeAll = await removeAllPinnedPosts({ userID: req.headers.userid });

    if (removeAll.error) return res.status(400).send(removeAll);
    return res.status(200).send(removeAll);
});

router.post('/:postID', async (req, res) => {
    const { postID } = req.params;
    const addPin = await addPinnedPost({ postID, userID: req.headers.userid });

    if (addPin.error) return res.status(400).send(addPin);
    return res.status(200).send(addPin);
});

router.delete('/:postID', async (req, res) => {
    console.log("h")
    const { postID } = req.params;
    const removePin = await removePinnedPost({ postID, userID: req.headers.userid });

    if (removePin.error) return res.status(400).send(removePin);
    return res.status(200).send(removePin);
});



module.exports = router;
