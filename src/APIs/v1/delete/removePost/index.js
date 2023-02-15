const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
// const interactRepliesSchema = require('../../../../schemas/postSchemas/interactRepliesSchema');
const { removePost } = require('../../../../utils/post/removePost');

router.delete('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    const { userid } = req.headers;
    
    if (!postID) return res.status(400).send(searchError("D006")); //searchError("E003"))

    // check if post exists
    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchError("D001"));
    else if (PostData.userID != userid) return res.status(403).send(searchError("D007"));

    const deleted = await removePost(PostData);
    if (deleted.error) return res.status(500).send("error");
    return res.status(200).send({'deleted': true, post: PostData});
})

module.exports = router;
