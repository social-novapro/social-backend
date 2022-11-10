const router = require('express').Router();
const interactVerifyRequests = require('../../../../schemas/interactVerifyRequests')
const interactVerificationSchema = require('../../../../schemas/interactVerificationSchema')
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { content } = req.body;
    const { userid } = req.headers;
    
    const lookupRequest = await interactVerifyRequests.findOne({ _id: userid });
    if (lookupRequest) return res.status(403).send(searchError("J001"));
    
    const lookupVerification = await interactVerificationSchema.findOne({ _id: userid });
    if (lookupVerification) return res.status(403).send(searchError("J004"));

    if (!content) return res.status(400).send(searchError("J002"));

    await interactVerifyRequests.findOneAndUpdate( 
        { _id: userid },
        {
            content,
            timestamp: checktime()
        },
        { upsert: true }
    );

    const NewRequest = await interactVerifyRequests.findOne({ _id: userid });
    if (!NewRequest) return res.status(404).send(searchError("J003"));
    else return res.status(200).send({NewRequest});
});

module.exports = router;
