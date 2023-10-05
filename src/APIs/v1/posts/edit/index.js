const router = require('express').Router();
const { editPost } = require('../../../../utils/post');

router.put('/', async (req, res) => {
    const postEdited = await editPost({
        postID: req.body.postID,
        content: req.body.content,
        userID: req.headers.userid
    })

    if (postEdited.error) return res.status(403).send(postEdited);
    return res.status(200).send(postEdited);
})

module.exports = router;
