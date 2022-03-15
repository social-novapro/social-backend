const router = require('express').Router();
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const developerToken = require('../../../../schemas/developer/developerToken');
const interactUserAnalyticSchema = require('../../../../schemas/analytics/interactUserAnalyticSchema');
const { checkRequestTokens } = require('./../../../../utils/checkRequestTokens');

router.get('/:userID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userID } = req.params;
    
    const UserData = await interactUserSchema.find({ _id: userID});
    const UserPrivData = await interactUserPrivSchema.find({_id: userID});
    const PostData = await interactPostSchema.find({ userID });
    const devTokenData = await developerToken.find({ userID });
    const devAppTokensData = await developerAppToken.find({ userID });
    const analyticData = await interactUserAnalyticSchema.find({ _id: userID });

    const allData = {
        "userProfile" : UserData,
        "userPrivate" : UserPrivData,
        "posts" : PostData,
        "devToken" : devTokenData,
        "appTokens" : devAppTokensData,
        "analytics" : analyticData
    };

    return res.status(200).send(allData);
})

module.exports = router;
