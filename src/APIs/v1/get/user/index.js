const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { getPostWithData } = require('../../../../utils/post/getPost');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({_id: userID});
    const PostData = await interactPostSchema.find({userID});


    if (!UserData) return res.status(400).send(searchErrorV2("B001", { userID: req.headers.userid }));
    const ownUser = await interactUserSchema.findOne({_id: req.headers.userid});

    var pins = [];
    if (UserData.pins && UserData.pins.length > 0) {
        for (const pin of UserData.pins) {
            const pinData = await getPostWithData({ userID: req.headers.userid, postID: pin, ownUser });
            if (pinData.error) {
                await interactUserSchema.findOneAndUpdate({
                    _id: userID,
                }, {
                    $pull: {
                        pins: { _id: pin },
                    },
                })
            }
            
            if (!pinData.error) pins.push(pinData);
        }
    }

    var send = {
        included: {
            user: "true",
            posts: `${PostData ? true : false}`,
            pins: pins.length > 0 ? true : false
        },
        userData: UserData,
        postData: PostData,
        pinData: pins
    }

    return res.status(200).send(send);
});

module.exports = router;
