const router = require('express').Router();
const interactPostLikeSchema = require('../../../../schemas/postSchemas/interactPostLikeSchema');
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { checkRequestTokens } = require('./../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.delete('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound) return res.status(404).send(searchError("K002"));

    // look if user has liked the post
   // //const userLiked = await interactPostLikeSchema.findOne({ _id: postID, peopleLiked: { $elemMatch: { _id: tokenData.userID } } });
    //if (userLiked) return res.status(400).send({ error: "user has already liked the post" });

    var userID = req.headers.userid
    
    const postLikes = await interactPostLikeSchema.findOne({ _id: postID});
    var foundLiked = false
    if (postLikes)  {
        for (const like of postLikes.peopleLiked) {
            if (like._id == userID) foundLiked = true
        };
    };

    if (!foundLiked) return res.status(400).send({"error" : "user did not previously like the post."});

    await interactPostLikeSchema.findOneAndUpdate(
        { _id: postID }, 
        { $pull : { "peopleLiked" : { _id: userID } } },
        { upsert: true }
    )

    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes - 1;

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    
    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
    return res.status(200).send(postFoundNew);
})

module.exports = router;
