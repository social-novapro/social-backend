const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { isLiked } = require('../../../../utils/post/isLiked');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    
    const PostData = await interactPostSchema.findOne({_id: postID});

    const foundLike = await isLiked({ postID: postID, userID: req.headers.userid });
    if (foundLike) PostData.liked=true;    

    if (!PostData) return res.status(404).send(searchError("D001"));
    else return res.status(200).send(PostData);
})

module.exports = router;
