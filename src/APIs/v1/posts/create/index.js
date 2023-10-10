const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { newPostIndex } = require('../../../../utils/post/createPost');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkPostContent } = require('../../../../utils/checks');
const { pushNewPost } = require('../../../../utils/notifications/pushNewPost'); 

router.post('/', async (req, res) => {
    const { content, userID } = req.body
    if (userID != req.headers.userid) return res.status(400).send(searchErrorV2("E009", { userID: req.headers.userid }));
    var quoteReplyPostID = req.body.quoteReplyPostID ? req.body.quoteReplyPostID : undefined;
    var replyingPostID = req.body.replyingPostID ? req.body.replyingPostID : undefined;
    var linkedPollID = req.body.linkedPollID ? req.body.linkedPollID : undefined;
   
    if (!content && !userID) return res.status(400).send(searchErrorV2("E001", { userID }));
    else if (!content) return res.status(400).send(searchErrorV2("E002", { userID }));
    else if (!userID) return res.status(400).send(searchErrorV2("E003", { userID }));

    const checkedContent = await checkPostContent(content);
    if (checkedContent.error) return res.status(400).send(checkedContent);

    const userIDCheck = await interactUserSchema.findOne({ _id: userID});
    if (!userIDCheck) return res.status(403).send(searchErrorV2("E004", { userID }));

    const postID = await newPostIndex(userID, {content, quoteReplyPostID, replyingPostID, linkedPollID});
    
    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchErrorV2("D002", { userID }));

    await pushNewPost(userID, postID)
    return res.status(200).send(PostData);
});

module.exports = router;
