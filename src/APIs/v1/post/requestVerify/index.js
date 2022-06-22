const router = require('express').Router();
const interactVerifyRequests = require('../../../../schemas/postSchemas/interactVerifyRequests')
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { content } = req.body;
    const { userid } = req.headers;
    
    const lookupRequest = await interactVerifyRequests.findOne({ _id: userid });
    if (lookupRequest) return res.status(403).send({ "error" : "User already has a request pending."});
    
    if (!content) return res.status(400).send({ "error" : "No content provided."});

    await interactVerifyRequests.findOneAndUpdate( 
        { _id: userid },
        {
            content,
            timestamp: checktime()
        },
        { upsert: true }
    );

    const NewRequest = await interactVerifyRequests.findOne({ _id: postID });
    if (!NewRequest) return res.status(404).send({"error" : "an error occured while saving request, please try again."});
    else return res.status(200).send({NewRequest});
});

module.exports = router;
