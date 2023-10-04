const { getPostWithData } = require('../../../../utils/post/getPost');
const router = require('express').Router();

router.get('/:postID', async (req, res) => {
    const { postID } = req.params;
    const postData = await getPostWithData({ userID: req.headers.userid, postID})
    if (postData.error) return res.status(404).send(postData);
    else return res.status(200).send(postData.postData);
})

module.exports = router;
