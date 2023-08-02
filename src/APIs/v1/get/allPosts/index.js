const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { isLiked } = require('../../../../utils/post/isLiked');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const AllPosts = await interactPostSchema.find();

    sendPosts = [ ];

    for (post of AllPosts) {
        if (post.content) {
            var type = null;
            var postData = post;
            var userData = null;

            const foundLike = await isLiked({ postID: post._id, userID: req.headers.userid });
            if (foundLike) postData.liked = true;

            if (post.userID) {
                const UserDataFound = await interactUserSchema.findOne({_id: post.userID});
                if (UserDataFound) {
                    userData = UserDataFound;
                    type = { "type" : "post", "user" : "included" };
                } else type = { "type" : "post"};
            } else type = { "type" : "post" };

            var dataSend = { type, postData, userData};
            sendPosts.push(dataSend);
        }
    }
    
    if (!AllPosts) return res.status(404).send(searchError("D003"));
    else return res.status(200).send(sendPosts);
})

module.exports = router;
