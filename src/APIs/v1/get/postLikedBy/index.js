const router = require('express').Router();
const interactPostLikeSchema = require('../../../../schemas/postSchemas/interactPostLikeSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    const foundPost = await interactPostLikeSchema.findOne({ _id: postID});

    var returnData = {
        postID,
        peopleLiked: []
    };

    if (!foundPost) return res.status(404).send(searchErrorV2("D005", { userID: req.headers.userid }));

    for (const people of foundPost.peopleLiked) {
        const user = await interactUserSchema.findOne({_id: people._id});
        if (user) {
            returnData.peopleLiked.push({
                userID: people._id,
                username: user.username
            });
        };
    };
    // console.log(returnData)

    return res.status(200).send(returnData);
});

module.exports = router;
