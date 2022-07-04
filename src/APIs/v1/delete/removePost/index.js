const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.delete('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    const { userid } = req.headers;
    
    if (!postID) return res.status(400).send(searchError("D006")); //searchError("E003"))

    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchError("D001"));
    else if (PostData.userID != userid) return res.status(403).send(searchError("D007"));

    await interactPostSchema.findOneAndDelete({_id: postID});
    return res.status(200).send({'deleted': true, post: PostData});
})

module.exports = router;
