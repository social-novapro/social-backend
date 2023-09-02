const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { isLiked } = require('../../../../utils/post/isLiked');
const { getPostWithData } = require('../../../../utils/post/getPost');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    
    const postData = await getPostWithData({ userID: req.headers.userid, postID})

    if (postData.error) return res.status(404).send(postData);
    // in future give full postData, so no user fetching is required
    // or make an option
    else return res.status(200).send(postData.postData);
})

module.exports = router;
