const router = require('express').Router();
const interactPostLikeSchema = require('../../../../schemas/postSchemas/interactPostLikeSchema');
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { checkRequestTokens } = require('./../../../../utils/checkRequestTokens');

function checktime() {
    var d = new Date();
    const timeMS = d.getTime();

    return timeMS;
};

router.put('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    const postFound = await interactPostSchema.findOne({ _id: postID});
    if (!postFound) return res.status(404).send({ error: "post not found" });

    // look if user has liked the post
   // //const userLiked = await interactPostLikeSchema.findOne({ _id: postID, peopleLiked: { $elemMatch: { _id: tokenData.userID } } });
    //if (userLiked) return res.status(400).send({ error: "user has already liked the post" });


    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes + 1;
    console.log(postFound.totalLikes)

    console.log(newTotalLikes)

    var userID = req.headers.userid

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    
    const look =  await interactPostLikeSchema.findOne({ _id: postID, peopleLiked : { _id: userID } })  
    console.log(look)
    if (look) return res.status(400).send({ error: "user has already liked the post" });

    await interactPostLikeSchema.findOneAndUpdate(
        { _id: postID }, 
        { $push : { "peopleLiked" : { _id: userID, timeStamp: checktime() } } }
    )

    const postFoundNew = await interactPostSchema.findOne({ _id: postID});


    return res.status(200).send(postFoundNew);
})

module.exports = router;
