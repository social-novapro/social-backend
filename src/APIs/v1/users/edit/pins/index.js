const router = require('express').Router();
const { addPinnedPost, removePinnedPost } = require('../../../../../utils/user/edit');

router.post('/:postID', async (req, res) => {
    const { postID } = req.params;
    const addPin = await addPinnedPost({ postID, userID: req.headers.userid });

    if (addPin.error) return res.status(400).send(addPin);
    return res.status(200).send(addPin);
});

router.delete('/:postID', async (req, res) => {
    const { postID } = req.params;
    const removePin = await removePinnedPost({ postID, userID: req.headers.userid });

    if (removePin.error) return res.status(400).send(removePin);
    return res.status(200).send(removePin);
});

module.exports = router;
