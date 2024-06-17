const router = require('express').Router();
const { createNewPost } = require('../../../../utils/post/createPost');

router.post('/', async (req, res) => {
    const { content } = req.body
    const { userid: userID } = req.headers;
    
    var quoteReplyPostID = req.body.quoteReplyPostID ? req.body.quoteReplyPostID : undefined;
    var replyingPostID = req.body.replyingPostID ? req.body.replyingPostID : undefined;
    var linkedPollID = req.body.linkedPollID ? req.body.linkedPollID : undefined;
    var coposters = req.body.coposters ? req.body.coposters : undefined;
    var privacyOverride = req.body.privacyOverride ? req.body.privacyOverride : undefined;
   
    const postData = {
        content,
        userID,
        quoteReplyPostID,
        replyingPostID,
        linkedPollID,
        coposters,
        privacyOverride,
    }

    const newPost = await createNewPost(postData);
    if (newPost.error) return res.status(400).send(newPost);

    return res.status(200).send(newPost);
});

module.exports = router;
