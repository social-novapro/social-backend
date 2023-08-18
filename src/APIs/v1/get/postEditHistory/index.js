const router = require('express').Router();
const interactPostEditSchema = require('../../../../schemas/postSchemas/interactPostEditSchema');
const {searchErrorV2} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    
    const PostData = await interactPostEditSchema.findOne({_id: postID});

    if (!PostData) return res.status(404).send(searchErrorV2("D004", { userID: req.headers.userid }));
    else return res.status(200).send(PostData);
})

module.exports = router;
