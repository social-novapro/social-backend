const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({_id: userID});
    const PostData = await interactPostSchema.find({userID});


    if (!UserData) return res.status(400).send(searchErrorV2("B001", { userID: req.headers.userid }));

    var send = {
        included: {
            user: "true",
            posts: `${PostData ? true : false}`
        },
        userData: UserData,
        postData: PostData
    }

    return res.status(200).send(send);
});

module.exports = router;
