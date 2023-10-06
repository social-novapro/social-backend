const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { removePost } = require('../../../../utils/post/removePost');

router.delete('/:postID', async (req, res) => {
    const { postID } = req.params;
    const { userid } = req.headers;
    
    if (!postID) return res.status(400).send(searchErrorV2("D006", {userID: userid}));

    // check if post exists
    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchErrorV2("D001", {userID: userid}));
    else if (PostData.userID != userid) return res.status(403).send(searchErrorV2("D007", {userID: userid}));

    const deleted = await removePost(PostData);
    if (deleted.error) return res.status(403).send(deleted);
    return res.status(200).send({'deleted': true, post: PostData});
})

module.exports = router;
