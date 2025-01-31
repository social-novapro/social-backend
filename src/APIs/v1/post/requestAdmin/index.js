const router = require('express').Router();
const interactAdminRequestSchema = require('../../../../schemas/admin/interactAdminRequestSchema')
const interactAdminRequestSchema = require('../../../../schemas/admin/interactAdminSchema')
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');

router.post('/', async (req, res) => {
    const { content } = req.body;
    const { userid } = req.headers;
    
    const lookupRequest = await interactAdminRequestSchema.findOne({ _id: userid });
    if (lookupRequest) return res.status(403).send(searchErrorV2("J001", { userID: userid }));
    
    const lookupAdmin = await interactAdminRequestSchema.findOne({ _id: userid });
    if (lookupAdmin) return res.status(403).send(searchErrorV2("J005", { userID: userid }));

    if (!content) return res.status(400).send(searchErrorV2("J002", { userID: userid }));

    await interactAdminRequestSchema.findOneAndUpdate( 
        { _id: userid },
        {
            content,
            timestamp: checktime()
        },
        { upsert: true }
    );

    const newRequest = await interactAdminRequestSchema.findOne({ _id: userid });
    if (!newRequest) return res.status(404).send(searchErrorV2("J003", { userID: userid }));
    else return res.status(200).send({newRequest});
});

module.exports = router;
