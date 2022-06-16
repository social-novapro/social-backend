const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    
    const PostData = await interactPostEditsSchema.findOne({_id: postID});

    if (!PostData) return res.status(404).send({ "error" : "no edits found for post"});
    else return res.status(200).send(PostData);
})

module.exports = router;
