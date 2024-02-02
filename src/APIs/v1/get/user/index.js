const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { getPostWithData } = require('../../../../utils/post/getPost');
const { getUserPosts } = require('../../../../utils/post/user');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { getUserBadges } = require('../../../../utils/user/badges');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    const UserData = await interactUserSchema.findOne({_id: userID});
    const PostData = await getUserPosts({ userID, requesterID: req.headers.userid, coposts: true });

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
    var badges = await getUserBadges({userID});

    var send = {
        included: {
            user: "true",
            posts: `${PostData ? true : false}`,
            pins: pins.length > 0 ? true : false,
            badges: badges.length > 0 ? true : false
        },
        userData: UserData,
        postData: PostData,
        pinData: pins,
        badges: badges
    }

    return res.status(200).send(send);
});

module.exports = router;
