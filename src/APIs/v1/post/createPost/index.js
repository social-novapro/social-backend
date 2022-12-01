const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { newPostIndex } = require('../../../../utils/post/createPost');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkPostContent } = require('../../../../utils/checks');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { pushNewPost } = require('../../../../utils/notifications/pushNewPost'); 
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");


router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    
    const { content, userID } = req.body
    if (userID != req.headers.userid) return res.status(400).send(searchError("E009"));
    var quoteReplyPostID = req.body.quoteReplyPostID ? req.body.quoteReplyPostID : null;
    var replyingPostID = req.body.replyingPostID ? req.body.replyingPostID : null;
    // marked.setOptions({
    //     gfm: true,
    //     breaks: true,
    //     sanitizer: (text) => sanitizeHtml(text),
    // });
    
    if (!content && !userID) return res.status(400).send(searchError("E001"));
    else if (!content) return res.status(400).send(searchError("E002"));
    else if (!userID) return res.status(400).send(searchError("E003"));

    const checkedContent = await checkPostContent(content);
    if (checkedContent) return res.status(400).send(checkedContent.error);

    const userIDCheck = await interactUserSchema.findOne({ _id: userID});
  
    if (!userIDCheck) return res.status(403).send(searchError("E004"));
    // const markdownContent = marked.parse(content)
    // const markdownContent = sanitizeHtml(marked.parse(content))
    // console.log(markdownContent)
    const postID = await newPostIndex(userID, {content, quoteReplyPostID, replyingPostID});
    if (replyingPostID) {
        const replyingPost = await interactPostSchema.findOne({ _id: replyingPostID });
        await interactPostSchema.findOneAndUpdate(
            { _id: replyingPostID },
            {
                totalReplies: replyingPost.totalReplies ? replyingPost.totalReplies++ : 1,
            }
        );  
    };
    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchError("D002"));

    await pushNewPost(userID, postID)
    return res.status(200).send(PostData);
})

module.exports = router;
