const router = require('express').Router();
const interactPostLikeSchema = require('../../../../schemas/postSchemas/interactPostLikeSchema');
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { checkRequestTokens } = require('./../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

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
    if (!postFound) return res.status(404).send(searchErrorV2("K002", { userID: req.headers.userid }));

    // look if user has liked the post
   // //const userLiked = await interactPostLikeSchema.findOne({ _id: postID, peopleLiked: { $elemMatch: { _id: tokenData.userID } } });
    //if (userLiked) return res.status(400).send({ error: "user has already liked the post" });

    var userID = req.headers.userid
    
    const postLikes = await interactPostLikeSchema.findOne({ _id: postID});
    
    var operation = "add"

    if (postLikes)  {
        for (const like of postLikes.peopleLiked) {
            if (like._id == userID) return res.status(400).send(searchErrorV2("D010", { userID: req.headers.userid }));
            //operation = "sub";
        };
    };

    // console.log(operation)
   
    // if (userAlreadyLiked) return res.status(400).send({ error: "user has already liked the post" });
    // var totalLikes = postFound.totalLikes ? postFound.totalLikes : 0

    // if (operation == "add") {
    await interactPostLikeSchema.findOneAndUpdate(
        { _id: postID }, 
        { $push : { "peopleLiked" : { _id: userID, timeStamp: checktime() } } },
        { upsert: true }
    )

    var newTotalLikes = 0
    if (!postFound.totalLikes) newTotalLikes = 1
    else newTotalLikes = postFound.totalLikes + 1;
    // console.log(postFound.totalLikes)

    // console.log(newTotalLikes)

    await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });
    
    
    // await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: totalLikes + 1}, { upsert: true });
    
    /*} else if (operation == "sub") {
        await interactPostLikeSchema.findOneAndUpdate(
            { _id: postID }, 
            { $pull : { "peopleLiked" : { _id: userID, timeStamp: checktime() } } },
            { safe: true, multi: false },
            { upsert: true }
        );
        await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: totalLikes - 1}, { upsert: true });

    };*/

    // var newTotalLikes = 0
    // if (!postFound.totalLikes) newTotalLikes = 1
    // else newTotalLikes = postFound.totalLikes + 1;

    // await editAmountLikes(postID, postFound, operation)
    // await interactPostSchema.findOneAndUpdate({ _id: postID}, { totalLikes: newTotalLikes}, { upsert: true });

    const postFoundNew = await interactPostSchema.findOne({ _id: postID});
// console.log(postFoundNew)
// console.log(postFound)
    return res.status(200).send(postFoundNew);
})

module.exports = router;
