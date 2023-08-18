const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const AllUsers = await interactUserSchema.find();
    const AllPosts = await interactPostSchema.find();

    // sendUsers = [ ]
    // for (user of AllUsers) if (user.content) sendPosts.push(post)
    
    sendPosts = [ ]
    for (post of AllPosts) if (post.content) sendPosts.push(post);
    
    if (!AllUsers) return res.status(404).send(searchErrorV2("C005", { userID : req.headers.userid }));
    else if (!AllPosts) return res.status(404).send(searchErrorV2("D003", { userID : req.headers.userid }));
    
    const sendData = {
        "posts" : sendPosts,
        "users" : AllUsers
    };

    return res.status(200).send(sendData);
})

module.exports = router;
