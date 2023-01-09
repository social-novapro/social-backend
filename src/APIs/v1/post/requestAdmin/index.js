const router = require('express').Router();
const interactAdminRequestSchema = require('../../../../schemas/admin/interactAdminRequestSchema')
const interactAdminRequestSchema = require('../../../../schemas/admin/interactAdminSchema')
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { content } = req.body;
    const { userid } = req.headers;
    
    const lookupRequest = await interactAdminRequestSchema.findOne({ _id: userid });
    if (lookupRequest) return res.status(403).send(searchError("J001"));
    
    const lookupAdmin = await interactAdminRequestSchema.findOne({ _id: userid });
    if (lookupAdmin) return res.status(403).send(searchError("J005"));

    if (!content) return res.status(400).send(searchError("J002"));

    await interactAdminRequestSchema.findOneAndUpdate( 
        { _id: userid },
        {
            content,
            timestamp: checktime()
        },
        { upsert: true }
    );

    const newRequest = await interactAdminRequestSchema.findOne({ _id: userid });
    if (!newRequest) return res.status(404).send(searchError("J003"));
    else return res.status(200).send({newRequest});
});

module.exports = router;
