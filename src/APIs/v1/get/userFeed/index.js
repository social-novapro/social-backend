const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { searchError } = require('../../../../utils/searchError');

router.get('/:userid', async (req, res) => {
    return res.status(400).send(searchError("I002"));
    
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;

    
    const AllPosts = await interactPostSchema.find();

    sendPosts = [ ];

    for (post of AllPosts) {
        if (post.content) {
            var type;
            var postData = post;
            var userData;

            if (post.userID) {
                const UserData = await interactUserSchema.findOne({_id: post.userID});
                if (UserData) {
                    userData = UserData;
                    type = { "type" : "post", "user" : "included" };
                } else type = { "type" : "post"};
            } else type = { "type" : "post" };

            var dataSend = { type, postData, userData};
            sendPosts.push(dataSend);
        };
    };
    
    if (!AllPosts) return res.status(404).send(searchError("D003"));
    else return res.status(200).send(sendPosts);
})

module.exports = router;
