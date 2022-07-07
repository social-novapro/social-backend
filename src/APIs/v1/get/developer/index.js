const router = require('express').Router();
const developerToken = require('../../../../schemas/developer/developerToken');
const developerAppToken = require('../../../../schemas/developer/developerAppToken');
const interactUserAccessSchema = require('../../../../schemas/interactUserAccessSchema')
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid } = req.headers

    var returnData = {
        developer: false,
        applications: false,
        allowedApplications: false,
        DeveloperToken: {},
        AppTokens: [],
        AppAccesses: []
    };

    const allowedApplicationsFound = await interactUserAccessSchema.find({ userID: userid});
    if (allowedApplicationsFound) {
        returnData.allowedApplications = true
        returnData.AppAccesses = allowedApplicationsFound
    }

    const devTokenFound = await developerToken.findOne({ userID: userid });

    if (devTokenFound) {
        returnData.developer = true
        returnData.DeveloperToken = devTokenFound;

        const appTokensFound = await developerAppToken.find({ devToken: devTokenFound._id});
        if (appTokensFound) {
            returnData.applications = true
            returnData.AppTokens = appTokensFound
        }
    }

   return res.status(200).send(returnData);
});

module.exports = router;
