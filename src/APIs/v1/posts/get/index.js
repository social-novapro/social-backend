const { getPostWithData } = require('../../../../utils/post/getPost');
const { getPostThread } = require('../../../../utils/post/getPostThread');
const router = require('express').Router();

router.get('/:postID', async (req, res) => {
    const { postID } = req.params;
    const postData = await getPostWithData({ userID: req.headers.userid, postID})
    
    if (postData.error) return res.status(404).send(postData);
    else return res.status(200).send(postData.postData); // wtf?
})

router.get('/full/:postID', async (req, res) => {
    const { postID } = req.params;
    const postData = await getPostWithData({ userID: req.headers.userid, postID})
    
    if (postData.error) return res.status(404).send(postData);
    else return res.status(200).send(postData);
})

router.get('/thread/:postID', async (req, res) => {
    // get newer replies max 5
    // get older replies max 10

    const { postID } = req.params;
    const postData = await getPostThread({ userID: req.headers.userid, postID})
    
    if (postData.error) return res.status(404).send(postData);
    else return res.status(200).send(postData);
})

module.exports = router;
